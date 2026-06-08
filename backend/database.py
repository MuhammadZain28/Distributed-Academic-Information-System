"""
Database configuration for distributed university system.
Each university maintains its own local database (horizontal fragmentation).
Central server manages connection pooling and query routing.
"""

import asyncpg
from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()


class DBConfig(BaseSettings):
    # UET
    uet_connection_string: str = os.getenv("UET_CONNECTION_STRING")
    # Punjab
    punjab_connection_string: str = os.getenv("PUNJAB_CONNECTION_STRING")
    # NUCES
    nuces_connection_string: str = os.getenv("NUCES_CONNECTION_STRING")

    punjab_db_password: str = "punjab_pass_2024"

    # NUCES
    nuces_db_host: str = "localhost"
    nuces_db_port: int = 5434
    nuces_db_name: str = "nuces_db"
    nuces_db_user: str = "nuces_admin"
    nuces_db_password: str = "nuces_pass_2024"

    class Config:
        env_file = ".env"
        extra = "allow"


config = DBConfig()

# Global connection pools - one per university node
_pools: dict[str, Optional[asyncpg.Pool]] = {
    "uet": None,
    "punjab": None,
    "nuces": None,
}

UNIVERSITY_DSN = {
    "uet": config.uet_connection_string,
    "punjab": config.punjab_connection_string,
    "nuces": config.nuces_connection_string,
}

UNIVERSITY_META = {
    "uet": {
        "id": "uet",
        "name": "University of Engineering & Technology",
        "short": "UET Lahore",
        "city": "Lahore",
        "established": 1921,
        "type": "Public",
        "ranking": 1,
        "color": "#5287d6",
    },
    "punjab": {
        "id": "punjab",
        "name": "University of the Punjab",
        "short": "PU Lahore",
        "city": "Lahore",
        "established": 1882,
        "type": "Public",
        "ranking": 2,
        "color": "#54c190",
    },
    "nuces": {
        "id": "nuces",
        "name": "National University of Computer & Emerging Sciences",
        "short": "NUCES (FAST)",
        "city": "Lahore",
        "established": 2000,
        "type": "Private",
        "ranking": 3,
        "color": "#ac46c1",
    },
}


async def get_pool(university: str) -> Optional[asyncpg.Pool]:
    """Get connection pool for a specific university node."""
    return _pools.get(university)


async def init_pools():
    """Initialize connection pools for all university databases."""
    for uni, dsn in UNIVERSITY_DSN.items():
        try:
            _pools[uni] = await asyncpg.create_pool(dsn, min_size=2, max_size=10, command_timeout=30)
            print(f"[DB] Connected to {uni} database")
        except Exception as e:
            print(f"[DB] WARNING: Could not connect to {uni} database: {e}")
            _pools[uni] = None


async def close_pools():
    """Close all connection pools."""
    for uni, pool in _pools.items():
        if pool:
            await pool.close()
            print(f"[DB] Closed {uni} pool")


async def execute_on_node(university: str, query: str, *args):
    """Execute query on a specific university node."""
    pool = _pools.get(university)
    if not pool:
        raise ConnectionError(f"No connection to {university} database")
    async with pool.acquire() as conn:
        return await conn.fetch(query, *args)


async def execute_on_all_nodes(query: str, *args) -> dict:
    """
    Distributed query: execute on all available nodes and aggregate results.
    Demonstrates distributed query processing concept.
    """
    results = {}
    for uni, pool in _pools.items():
        if pool:
            try:
                async with pool.acquire() as conn:
                    rows = await conn.fetch(query, *args)
                    results[uni] = [dict(r) for r in rows]
            except Exception as e:
                results[uni] = {"error": str(e)}
        else:
            results[uni] = {"error": "Node unavailable"}
    return results
