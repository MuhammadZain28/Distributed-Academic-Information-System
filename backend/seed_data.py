"""
Schema creation and seed data for all three university databases.
Each university has its own local schema (horizontal fragmentation by university).
Public data is replicated across nodes for fault tolerance.
"""

# Shared schema - applied to each university's local database
SCHEMA_SQL = """
-- Departments table (horizontally fragmented by university)
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    university_id VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) NOT NULL,
    faculty VARCHAR(200),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Programs offered
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    university_id VARCHAR(20) NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    name VARCHAR(200) NOT NULL,
    degree_type VARCHAR(50) NOT NULL,  -- BS, MS, PhD, etc.
    duration_years INTEGER DEFAULT 4,
    total_seats INTEGER DEFAULT 0,
    available_seats INTEGER DEFAULT 0,
    description TEXT
);

-- Admission criteria
CREATE TABLE IF NOT EXISTS admission_criteria (
    id SERIAL PRIMARY KEY,
    university_id VARCHAR(20) NOT NULL,
    program_id INTEGER REFERENCES programs(id),
    session VARCHAR(50) NOT NULL,
    min_fsc_percentage DECIMAL(5,2),
    entry_test_required BOOLEAN DEFAULT TRUE,
    entry_test_name VARCHAR(100),
    min_entry_test_score INTEGER,
    merit_formula TEXT,
    deadline DATE,
    status VARCHAR(20) DEFAULT 'open'  -- open, closed, upcoming
);

-- Fee structures
CREATE TABLE IF NOT EXISTS fee_structures (
    id SERIAL PRIMARY KEY,
    university_id VARCHAR(20) NOT NULL,
    program_id INTEGER REFERENCES programs(id),
    semester_fee DECIMAL(12,2),
    annual_fee DECIMAL(12,2),
    admission_fee DECIMAL(12,2),
    security_deposit DECIMAL(12,2),
    other_charges DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'PKR',
    session VARCHAR(50)
);

-- Scholarships
CREATE TABLE IF NOT EXISTS scholarships (
    id SERIAL PRIMARY KEY,
    university_id VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100),  -- merit, need-based, sports, etc.
    coverage_percentage DECIMAL(5,2),
    eligibility_criteria TEXT,
    seats_available INTEGER,
    deadline DATE,
    status VARCHAR(20) DEFAULT 'active'
);

-- Merit lists (replicated public data for distributed access)
CREATE TABLE IF NOT EXISTS merit_lists (
    id SERIAL PRIMARY KEY,
    university_id VARCHAR(20) NOT NULL,
    program_id INTEGER REFERENCES programs(id),
    session VARCHAR(50) NOT NULL,
    list_number INTEGER DEFAULT 1,
    closing_merit DECIMAL(5,2),
    published_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'published'
);

-- Replication log (tracks sync between nodes)
CREATE TABLE IF NOT EXISTS replication_log (
    id SERIAL PRIMARY KEY,
    source_node VARCHAR(20),
    target_node VARCHAR(20),
    table_name VARCHAR(100),
    operation VARCHAR(20),
    record_id INTEGER,
    synced_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'success'
);
"""

# ─── UET Seed Data ────────────────────────────────────────────────────────────
UET_SEED = """
-- UET Departments
INSERT INTO departments (university_id, name, code, faculty, description) VALUES
('uet', 'Computer Science', 'CS', 'Faculty of Electrical Engineering', 'Covers programming, AI, systems, and networks.'),
('uet', 'Electrical Engineering', 'EE', 'Faculty of Electrical Engineering', 'Power systems, electronics, and control.'),
('uet', 'Civil Engineering', 'CE', 'Faculty of Civil Engineering', 'Structures, transportation, and geotechnics.'),
('uet', 'Mechanical Engineering', 'ME', 'Faculty of Mechanical Engineering', 'Thermodynamics, manufacturing, and design.'),
('uet', 'Chemical Engineering', 'CHE', 'Faculty of Chemical Engineering', 'Process engineering and polymer science.')
ON CONFLICT DO NOTHING;

-- UET Programs
INSERT INTO programs (university_id, department_id, name, degree_type, duration_years, total_seats, available_seats, description) VALUES
('uet', 1, 'Bachelor of Science in Computer Science', 'BS', 4, 120, 20, 'Flagship CS program with specializations in AI and Systems.'),
('uet', 2, 'Bachelor of Science in Electrical Engineering', 'BS', 4, 150, 35, 'Accredited by PEC, covers power and electronics.'),
('uet', 3, 'Bachelor of Science in Civil Engineering', 'BS', 4, 100, 10, 'Industry-oriented structural engineering curriculum.'),
('uet', 1, 'Master of Science in Computer Science', 'MS', 2, 40, 15, 'Research and coursework tracks available.'),
('uet', 2, 'PhD in Electrical Engineering', 'PhD', 4, 20, 8, 'Fully funded positions for research excellence.')
ON CONFLICT DO NOTHING;

-- UET Admission Criteria
INSERT INTO admission_criteria (university_id, program_id, session, min_fsc_percentage, entry_test_required, entry_test_name, min_entry_test_score, merit_formula, deadline, status) VALUES
('uet', 1, '2024-2025', 60.00, TRUE, 'ECAT', 40, '50% FSc + 50% ECAT', '2024-08-31', 'closed'),
('uet', 2, '2024-2025', 60.00, TRUE, 'ECAT', 40, '50% FSc + 50% ECAT', '2024-08-31', 'closed'),
('uet', 1, '2025-2026', 60.00, TRUE, 'ECAT', 40, '50% FSc + 50% ECAT', '2025-08-31', 'open')
ON CONFLICT DO NOTHING;

-- UET Fee Structures
INSERT INTO fee_structures (university_id, program_id, semester_fee, annual_fee, admission_fee, security_deposit, session) VALUES
('uet', 1, 45000, 90000, 15000, 10000, '2024-2025'),
('uet', 2, 42000, 84000, 15000, 10000, '2024-2025'),
('uet', 3, 38000, 76000, 15000, 10000, '2024-2025'),
('uet', 4, 55000, 110000, 20000, 10000, '2024-2025')
ON CONFLICT DO NOTHING;

-- UET Scholarships
INSERT INTO scholarships (university_id, name, type, coverage_percentage, eligibility_criteria, seats_available, status) VALUES
('uet', 'Chancellor Merit Scholarship', 'merit', 100.00, 'Top 5% in ECAT with 80%+ FSc', 30, 'active'),
('uet', 'Need-Based Financial Aid', 'need-based', 75.00, 'Family income < 50,000 PKR/month', 50, 'active'),
('uet', 'Sports Excellence Award', 'sports', 50.00, 'National/Provincial level sports representation', 10, 'active')
ON CONFLICT DO NOTHING;

-- UET Merit Lists
INSERT INTO merit_lists (university_id, program_id, session, list_number, closing_merit, status) VALUES
('uet', 1, '2024-2025', 1, 87.45, 'published'),
('uet', 1, '2024-2025', 2, 84.20, 'published'),
('uet', 2, '2024-2025', 1, 85.10, 'published'),
('uet', 3, '2024-2025', 1, 79.60, 'published')
ON CONFLICT DO NOTHING;
"""

# ─── Punjab University Seed Data ──────────────────────────────────────────────
PUNJAB_SEED = """
-- Punjab Departments
INSERT INTO departments (university_id, name, code, faculty, description) VALUES
('punjab', 'Computer Science', 'CS', 'Faculty of Computing', 'One of the oldest CS departments in Pakistan.'),
('punjab', 'Mathematics', 'MATH', 'Faculty of Science', 'Pure and applied mathematics programs.'),
('punjab', 'Physics', 'PHY', 'Faculty of Science', 'Classical and modern physics research.'),
('punjab', 'Business Administration', 'BBA', 'Faculty of Commerce', 'MBA and BBA programs with industry linkages.'),
('punjab', 'Law', 'LAW', 'Faculty of Law', 'LLB and LLM programs, bar association affiliated.')
ON CONFLICT DO NOTHING;

-- Punjab Programs
INSERT INTO programs (university_id, department_id, name, degree_type, duration_years, total_seats, available_seats, description) VALUES
('punjab', 1, 'Bachelor of Science in Information Technology', 'BS', 4, 100, 25, 'IT-focused curriculum with practical labs.'),
('punjab', 2, 'Bachelor of Science in Mathematics', 'BS', 4, 80, 30, 'Strong theoretical foundation with electives.'),
('punjab', 4, 'Bachelor of Business Administration', 'BBA', 4, 120, 40, 'Case-study driven business curriculum.'),
('punjab', 5, 'Bachelor of Laws', 'LLB', 5, 60, 5, '5-year integrated law program.'),
('punjab', 1, 'Master of Science in Computer Science', 'MS', 2, 50, 20, 'Advanced computing with research thesis.')
ON CONFLICT DO NOTHING;

-- Punjab Admission Criteria
INSERT INTO admission_criteria (university_id, program_id, session, min_fsc_percentage, entry_test_required, entry_test_name, min_entry_test_score, merit_formula, deadline, status) VALUES
('punjab', 1, '2024-2025', 50.00, TRUE, 'PU Entry Test', 50, '40% FSc + 60% Entry Test', '2024-09-15', 'closed'),
('punjab', 3, '2024-2025', 45.00, FALSE, NULL, NULL, '100% Intermediate Marks', '2024-09-15', 'closed'),
('punjab', 1, '2025-2026', 50.00, TRUE, 'PU Entry Test', 50, '40% FSc + 60% Entry Test', '2025-09-15', 'open')
ON CONFLICT DO NOTHING;

-- Punjab Fee Structures
INSERT INTO fee_structures (university_id, program_id, semester_fee, annual_fee, admission_fee, security_deposit, session) VALUES
('punjab', 1, 35000, 70000, 12000, 8000, '2024-2025'),
('punjab', 2, 18000, 36000, 8000, 5000, '2024-2025'),
('punjab', 3, 28000, 56000, 12000, 8000, '2024-2025'),
('punjab', 4, 22000, 44000, 10000, 5000, '2024-2025')
ON CONFLICT DO NOTHING;

-- Punjab Scholarships
INSERT INTO scholarships (university_id, name, type, coverage_percentage, eligibility_criteria, seats_available, status) VALUES
('punjab', 'Vice Chancellor Merit Award', 'merit', 100.00, 'Top 3 positions in entry test', 15, 'active'),
('punjab', 'PEEF Scholarship', 'need-based', 100.00, 'Punjab domicile, family income < 40,000 PKR', 200, 'active'),
('punjab', 'HEC Need-Based Scholarship', 'need-based', 50.00, 'Financially deserving students', 100, 'active')
ON CONFLICT DO NOTHING;

-- Punjab Merit Lists
INSERT INTO merit_lists (university_id, program_id, session, list_number, closing_merit, status) VALUES
('punjab', 1, '2024-2025', 1, 75.30, 'published'),
('punjab', 1, '2024-2025', 2, 72.10, 'published'),
('punjab', 3, '2024-2025', 1, 68.50, 'published')
ON CONFLICT DO NOTHING;
"""

# ─── NUCES Seed Data ──────────────────────────────────────────────────────────
NUCES_SEED = """
-- NUCES Departments
INSERT INTO departments (university_id, name, code, faculty, description) VALUES
('nuces', 'Computer Science', 'CS', 'School of Computing', 'Premier CS school, top placement record in Pakistan.'),
('nuces', 'Computer Engineering', 'CE', 'School of Engineering', 'Hardware-software integration and embedded systems.'),
('nuces', 'Artificial Intelligence', 'AI', 'School of Computing', 'Dedicated AI department, one of first in Pakistan.'),
('nuces', 'Data Science', 'DS', 'School of Computing', 'Statistics, ML, and big data specialization.'),
('nuces', 'Software Engineering', 'SE', 'School of Computing', 'Agile practices, DevOps, and large-scale systems.')
ON CONFLICT DO NOTHING;

-- NUCES Programs
INSERT INTO programs (university_id, department_id, name, degree_type, duration_years, total_seats, available_seats, description) VALUES
('nuces', 1, 'Bachelor of Science in Computer Science', 'BS', 4, 200, 30, 'Industry-leading CS program with 95% placement rate.'),
('nuces', 3, 'Bachelor of Science in Artificial Intelligence', 'BS', 4, 80, 10, 'First dedicated AI undergraduate in Pakistan.'),
('nuces', 4, 'Bachelor of Science in Data Science', 'BS', 4, 60, 15, 'Analytics, visualization, and machine learning.'),
('nuces', 5, 'Bachelor of Science in Software Engineering', 'BS', 4, 100, 20, 'SWEBOK-aligned curriculum with agile focus.'),
('nuces', 1, 'Master of Science in Computer Science', 'MS', 2, 60, 25, 'Research with industry collaboration projects.')
ON CONFLICT DO NOTHING;

-- NUCES Admission Criteria
INSERT INTO admission_criteria (university_id, program_id, session, min_fsc_percentage, entry_test_required, entry_test_name, min_entry_test_score, merit_formula, deadline, status) VALUES
('nuces', 1, '2024-2025', 60.00, TRUE, 'NU Entry Test (NET)', 50, '25% Matric + 45% FSc + 30% NET', '2024-07-31', 'closed'),
('nuces', 2, '2024-2025', 65.00, TRUE, 'NU Entry Test (NET)', 60, '25% Matric + 45% FSc + 30% NET', '2024-07-31', 'closed'),
('nuces', 1, '2025-2026', 60.00, TRUE, 'NU Entry Test (NET)', 50, '25% Matric + 45% FSc + 30% NET', '2025-07-31', 'open')
ON CONFLICT DO NOTHING;

-- NUCES Fee Structures
INSERT INTO fee_structures (university_id, program_id, semester_fee, annual_fee, admission_fee, security_deposit, other_charges, session) VALUES
('nuces', 1, 135000, 270000, 25000, 15000, 5000, '2024-2025'),
('nuces', 2, 140000, 280000, 25000, 15000, 5000, '2024-2025'),
('nuces', 3, 130000, 260000, 25000, 15000, 5000, '2024-2025'),
('nuces', 4, 130000, 260000, 25000, 15000, 5000, '2024-2025')
ON CONFLICT DO NOTHING;

-- NUCES Scholarships
INSERT INTO scholarships (university_id, name, type, coverage_percentage, eligibility_criteria, seats_available, status) VALUES
('nuces', 'FAST Merit Scholarship', 'merit', 100.00, 'Top 10 in NET with 80%+ FSc', 20, 'active'),
('nuces', 'FAST 50% Tuition Waiver', 'merit', 50.00, 'Top 25% in NET score', 80, 'active'),
('nuces', 'FAST Need-Based Aid', 'need-based', 100.00, 'Means-tested family income < 60,000 PKR', 60, 'active'),
('nuces', 'Industry Partner Scholarship', 'industry', 75.00, 'Sponsored by tech companies (Google, Microsoft)', 10, 'active')
ON CONFLICT DO NOTHING;

-- NUCES Merit Lists
INSERT INTO merit_lists (university_id, program_id, session, list_number, closing_merit, status) VALUES
('nuces', 1, '2024-2025', 1, 91.20, 'published'),
('nuces', 1, '2024-2025', 2, 88.75, 'published'),
('nuces', 2, '2024-2025', 1, 89.50, 'published'),
('nuces', 3, '2024-2025', 1, 85.30, 'published')
ON CONFLICT DO NOTHING;
"""

SEED_DATA = {"uet": UET_SEED, "punjab": PUNJAB_SEED, "nuces": NUCES_SEED}
