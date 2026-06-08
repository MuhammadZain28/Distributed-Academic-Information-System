"""
Centralized Academic Information Portal - FastAPI Backend
Distributed Database System: Central Query Router + 3 University Nodes
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional
import time
from database import init_pools, close_pools, _pools, UNIVERSITY_META, execute_on_node
from query_router import (
    check_node_health,
    route_query,
    global_search,
    compare_programs,
    get_admission_overview,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database connections and seed data on startup."""
    print("[Startup] Initializing distributed database connections...")
    await init_pools()

    # Setup schema and seed data on available nodes
    for uni_id, pool in _pools.items():
        if pool:
            print(f"[Startup] Schema initialized for {uni_id}")
        else:
            print(f"[Startup] WARNING: No connection to {uni_id}, skipping schema setup")

    yield
    await close_pools()
    print("[Shutdown] All database connections closed")


app = FastAPI(
    title="Distributed University Information Portal",
    description="Centralized Academic Portal using Distributed Database Architecture",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health & System ──────────────────────────────────────────────────────────

@app.get("/api/health", tags=["System"])
async def health():
    return {"status": "online", "service": "Distributed University Portal", "nodes": list(UNIVERSITY_META.keys())}


@app.get("/api/nodes/status", tags=["System"])
async def node_status():
    """Check connectivity status of all university database nodes."""
    statuses = await check_node_health()
    return {"nodes": statuses}


@app.get("/api/universities", tags=["System"])
async def list_universities():
    """Return metadata for all universities in the distributed system."""
    return {"universities": list(UNIVERSITY_META.values())}


@app.get("/api/overview", tags=["System"])
async def system_overview():
    """Aggregated stats from all nodes — demonstrates distributed aggregation."""
    start = time.monotonic()
    stats = await get_admission_overview()
    latency = (time.monotonic() - start) * 1000

    # Enrich with university meta
    enriched = {}
    for uni_id, data in stats.items():
        enriched[uni_id] = {**UNIVERSITY_META.get(uni_id, {}), **data}

    return {
        "universities": enriched,
        "query_execution_ms": round(latency, 2),
        "nodes_queried": list(UNIVERSITY_META.keys()),
    }


# ─── Departments ──────────────────────────────────────────────────────────────

@app.get("/api/departments", tags=["Departments"])
async def get_departments(university: Optional[str] = None):
    """
    Retrieve departments. If university is specified, query that node only.
    Otherwise broadcast to all nodes (distributed query).
    """
    nodes = [university] if university else None
    result = await route_query("departments", universities=nodes)
    return result


@app.get("/api/departments/{university_id}", tags=["Departments"])
async def get_university_departments(university_id: str):
    """Get departments for a specific university node."""
    if university_id not in UNIVERSITY_META:
        raise HTTPException(404, f"University '{university_id}' not found")
    result = await route_query("departments", universities=[university_id])
    return result


# ─── Programs ─────────────────────────────────────────────────────────────────

@app.get("/api/programs", tags=["Programs"])
async def get_programs(
    university: Optional[str] = None,
    degree_type: Optional[str] = None,
):
    """Get programs with optional filtering. Supports cross-node queries."""
    nodes = [university] if university else None
    filters = {}
    if university:
        filters["university_id"] = university
    result = await route_query("programs", universities=nodes)

    # Apply degree filter in-memory after distributed fetch
    if degree_type:
        result["data"] = [r for r in result["data"] if r.get("degree_type") == degree_type]
        result["total_results"] = len(result["data"])

    return result


@app.get("/api/programs/compare", tags=["Programs"])
async def compare_programs_endpoint(
    universities: str = Query(..., description="Comma-separated university IDs"),
    degree_type: Optional[str] = None,
):
    """
    Compare programs across multiple universities.
    Demonstrates distributed semi-join / aggregation.
    """
    uni_list = [u.strip() for u in universities.split(",") if u.strip() in UNIVERSITY_META]
    if not uni_list:
        raise HTTPException(400, "No valid universities specified")

    data = await compare_programs(uni_list, degree_type)
    return {
        "universities": uni_list,
        "comparison": data,
        "university_meta": {uid: UNIVERSITY_META[uid] for uid in uni_list},
    }


# ─── Admission ────────────────────────────────────────────────────────────────

@app.get("/api/admissions", tags=["Admissions"])
async def get_admissions(
    university: Optional[str] = None,
    status: Optional[str] = None,
    session: Optional[str] = None,
):
    """Get admission criteria across nodes with optional filters."""
    nodes = [university] if university else None
    result = await route_query("admission_criteria", universities=nodes)

    data = result["data"]
    if status:
        data = [r for r in data if r.get("status") == status]
    if session:
        data = [r for r in data if r.get("session") == session]

    result["data"] = data
    result["total_results"] = len(data)
    return result


# ─── Fees ─────────────────────────────────────────────────────────────────────

@app.get("/api/fees", tags=["Fees"])
async def get_fees(university: Optional[str] = None, session: Optional[str] = None):
    """Get fee structures from one or all university nodes."""
    nodes = [university] if university else None
    result = await route_query("fee_structures", universities=nodes)

    if session:
        result["data"] = [r for r in result["data"] if r.get("session") == session]
        result["total_results"] = len(result["data"])

    return result


# ─── Scholarships ─────────────────────────────────────────────────────────────

@app.get("/api/scholarships", tags=["Scholarships"])
async def get_scholarships(
    university: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
):
    """Get scholarships across all nodes or filtered by university."""
    nodes = [university] if university else None
    result = await route_query("scholarships", universities=nodes)

    data = result["data"]
    if type:
        data = [r for r in data if r.get("type") == type]
    if status:
        data = [r for r in data if r.get("status") == status]

    result["data"] = data
    result["total_results"] = len(data)
    return result


# ─── Merit Lists ──────────────────────────────────────────────────────────────

@app.get("/api/merit-lists", tags=["Merit Lists"])
async def get_merit_lists(
    university: Optional[str] = None,
    session: Optional[str] = None,
    program_id: Optional[int] = None,
):
    """Get merit lists — replication demo: same data accessible from any node."""
    nodes = [university] if university else None
    result = await route_query("merit_lists", universities=nodes)

    data = result["data"]
    if session:
        data = [r for r in data if r.get("session") == session]
    if program_id:
        data = [r for r in data if r.get("program_id") == program_id]

    result["data"] = sorted(data, key=lambda x: x.get("closing_merit", 0), reverse=True)
    result["total_results"] = len(data)
    return result


# ─── Global Search (Distributed) ──────────────────────────────────────────────

@app.get("/api/search", tags=["Search"])
async def distributed_search(q: str = Query(..., min_length=2)):
    """
    Global distributed search across ALL nodes and ALL entity types.
    Demonstrates distributed query processing and result merging.
    """
    if not q.strip():
        raise HTTPException(400, "Search query cannot be empty")
    result = await global_search(q.strip())
    return result


# ─── Replication Log ──────────────────────────────────────────────────────────

@app.get("/api/replication/logs", tags=["Replication"])
async def get_replication_logs(university: Optional[str] = None):
    """View data replication logs across nodes."""
    nodes = [university] if university else None
    result = await route_query("replication_log", universities=nodes)
    return result


@app.post("/api/replication/simulate", tags=["Replication"])
async def simulate_replication():
    """
    Simulate public data replication between university nodes.
    In a real system, scholarship and merit list data would be replicated.
    """
    logs = []
    universities = list(UNIVERSITY_META.keys())

    for i, source in enumerate(universities):
        for target in universities:
            if source == target:
                continue
            pool = _pools.get(source)
            if not pool:
                continue
            try:
                async with pool.acquire() as conn:
                    await conn.execute("""
                        INSERT INTO replication_log (source_node, target_node, table_name, operation, record_id, status)
                        VALUES ($1, $2, 'scholarships', 'REPLICATE', 0, 'success')
                    """, source, target)
                    logs.append({"source": source, "target": target, "status": "success"})
            except Exception as e:
                logs.append({"source": source, "target": target, "status": "error", "error": str(e)})

    return {"message": "Replication simulation complete", "logs": logs}
