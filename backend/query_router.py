"""
Distributed Query Router
Implements distributed query processing concepts:
- Query decomposition and routing to appropriate nodes
- Result aggregation from multiple nodes
- Node health monitoring
- Replication management
"""

import time
import uuid
from typing import Optional, List
from database import _pools, execute_on_node, execute_on_all_nodes, UNIVERSITY_META


async def check_node_health() -> List[dict]:
    """Check connectivity and latency for all university nodes."""
    results = []
    for uni_id, meta in UNIVERSITY_META.items():
        pool = _pools.get(uni_id)
        if not pool:
            results.append({
                "university_id": uni_id,
                "university_name": meta["short"],
                "connected": False,
                "latency_ms": None,
            })
            continue
        try:
            start = time.monotonic()
            async with pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            latency = (time.monotonic() - start) * 1000
            results.append({
                "university_id": uni_id,
                "university_name": meta["short"],
                "connected": True,
                "latency_ms": round(latency, 2),
            })
        except Exception:
            results.append({
                "university_id": uni_id,
                "university_name": meta["short"],
                "connected": False,
                "latency_ms": None,
            })
    return results


async def route_query(
    table: str,
    universities: Optional[List[str]] = None,
    filters: Optional[dict] = None,
) -> dict:
    """
    Route a query to specified university nodes.
    If universities=None, broadcasts to all nodes (distributed query).
    """
    start = time.monotonic()
    query_id = str(uuid.uuid4())[:8]

    target_nodes = universities or list(UNIVERSITY_META.keys())

    # Build dynamic WHERE clause
    where_clauses = []
    args = []
    if filters:
        for i, (col, val) in enumerate(filters.items(), 1):
            where_clauses.append(f"{col} = ${i}")
            args.append(val)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    sql = f"SELECT * FROM {table} {where_sql} ORDER BY id"

    aggregated = []
    responded = []
    for node in target_nodes:
        pool = _pools.get(node)
        if not pool:
            continue
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *args)
                for row in rows:
                    aggregated.append(dict(row))
            responded.append(node)
        except Exception as e:
            print(f"[Router] Node {node} failed: {e}")

    exec_time = (time.monotonic() - start) * 1000

    return {
        "query_id": query_id,
        "nodes_queried": target_nodes,
        "nodes_responded": responded,
        "total_results": len(aggregated),
        "data": aggregated,
        "execution_time_ms": round(exec_time, 2),
    }


async def global_search(keyword: str) -> dict:
    """
    Execute a global distributed search across all nodes and all tables.
    Demonstrates distributed query processing with result merging.
    """
    start = time.monotonic()
    query_id = str(uuid.uuid4())[:8]
    keyword_lower = f"%{keyword.lower()}%"

    search_queries = {
        "departments": "SELECT 'department' as entity_type, id, university_id, name, code as subtitle, description FROM departments WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1",
        "programs": "SELECT 'program' as entity_type, id, university_id, name, degree_type as subtitle, description FROM programs WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1",
        "scholarships": "SELECT 'scholarship' as entity_type, id, university_id, name, type as subtitle, eligibility_criteria as description FROM scholarships WHERE LOWER(name) LIKE $1 OR LOWER(eligibility_criteria) LIKE $1",
    }

    results = []
    responded = []

    for node, pool in _pools.items():
        if not pool:
            continue
        try:
            async with pool.acquire() as conn:
                node_responded = False
                for entity, sql in search_queries.items():
                    rows = await conn.fetch(sql, keyword_lower)
                    for row in rows:
                        results.append(dict(row))
                        node_responded = True
                if node_responded:
                    responded.append(node)
        except Exception as e:
            print(f"[Search] Node {node} error: {e}")

    exec_time = (time.monotonic() - start) * 1000

    return {
        "query_id": query_id,
        "keyword": keyword,
        "nodes_queried": list(UNIVERSITY_META.keys()),
        "nodes_responded": responded,
        "total_results": len(results),
        "data": results,
        "execution_time_ms": round(exec_time, 2),
    }


async def compare_programs(universities: List[str], degree_type: Optional[str] = None) -> dict:
    """
    Compare programs across universities.
    Demonstrates distributed join / aggregation concept.
    """
    results = {}
    for node in universities:
        pool = _pools.get(node)
        if not pool:
            continue
        try:
            async with pool.acquire() as conn:
                sql = """
                    SELECT p.*, d.name as department_name, d.code as dept_code,
                           f.semester_fee, f.annual_fee, f.admission_fee
                    FROM programs p
                    LEFT JOIN departments d ON p.department_id = d.id
                    LEFT JOIN fee_structures f ON f.program_id = p.id
                    WHERE p.university_id = $1
                """
                args = [node]
                if degree_type:
                    sql += " AND p.degree_type = $2"
                    args.append(degree_type)
                rows = await conn.fetch(sql, *args)
                results[node] = [dict(r) for r in rows]
        except Exception as e:
            results[node] = []

    return results


async def get_admission_overview() -> dict:
    """Aggregate admission stats across all university nodes."""
    overview = {}
    for node, pool in _pools.items():
        if not pool:
            continue
        try:
            async with pool.acquire() as conn:
                stats = await conn.fetchrow("""
                    SELECT
                        COUNT(DISTINCT d.id) as departments,
                        COUNT(DISTINCT p.id) as programs,
                        SUM(p.total_seats) as total_seats,
                        SUM(p.available_seats) as available_seats,
                        COUNT(DISTINCT s.id) as scholarships
                    FROM departments d
                    LEFT JOIN programs p ON p.university_id = d.university_id
                    LEFT JOIN scholarships s ON s.university_id = d.university_id
                    WHERE d.university_id = $1
                """, node)
                overview[node] = dict(stats) if stats else {}
        except Exception as e:
            overview[node] = {"error": str(e)}
    return overview
