from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date, datetime
from decimal import Decimal


class UniversityMeta(BaseModel):
    id: str
    name: str
    short: str
    city: str
    established: int
    type: str
    ranking: int
    color: str


class Department(BaseModel):
    id: int
    university_id: str
    name: str
    code: str
    faculty: Optional[str]
    description: Optional[str]


class Program(BaseModel):
    id: int
    university_id: str
    department_id: Optional[int]
    name: str
    degree_type: str
    duration_years: int
    total_seats: int
    available_seats: int
    description: Optional[str]


class AdmissionCriteria(BaseModel):
    id: int
    university_id: str
    program_id: Optional[int]
    session: str
    min_fsc_percentage: Optional[float]
    entry_test_required: bool
    entry_test_name: Optional[str]
    min_entry_test_score: Optional[int]
    merit_formula: Optional[str]
    deadline: Optional[date]
    status: str


class FeeStructure(BaseModel):
    id: int
    university_id: str
    program_id: Optional[int]
    semester_fee: Optional[float]
    annual_fee: Optional[float]
    admission_fee: Optional[float]
    security_deposit: Optional[float]
    other_charges: Optional[float]
    currency: str
    session: str


class Scholarship(BaseModel):
    id: int
    university_id: str
    name: str
    type: Optional[str]
    coverage_percentage: Optional[float]
    eligibility_criteria: Optional[str]
    seats_available: Optional[int]
    status: str


class MeritList(BaseModel):
    id: int
    university_id: str
    program_id: Optional[int]
    session: str
    list_number: int
    closing_merit: Optional[float]
    published_at: Optional[datetime]
    status: str


class NodeStatus(BaseModel):
    university_id: str
    university_name: str
    connected: bool
    latency_ms: Optional[float]


class DistributedQueryResult(BaseModel):
    query_id: str
    nodes_queried: List[str]
    nodes_responded: List[str]
    total_results: int
    data: List[dict]
    execution_time_ms: float


class ComparisonResult(BaseModel):
    universities: List[str]
    category: str
    data: dict


class ReplicationLog(BaseModel):
    id: int
    source_node: str
    target_node: str
    table_name: str
    operation: str
    record_id: Optional[int]
    synced_at: datetime
    status: str
