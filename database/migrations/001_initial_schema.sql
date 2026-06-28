-- College Placement Tracker Database Schema
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE user_role AS ENUM ('student', 'coordinator', 'admin');
CREATE TYPE application_status AS ENUM ('applied', 'test_cleared', 'interview_scheduled', 'selected', 'rejected');
CREATE TYPE drive_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    college_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table (extends users)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roll_number VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    batch_year INTEGER,
    graduation_year INTEGER,
    cgpa DECIMAL(4,2),
    tenth_percentage DECIMAL(5,2),
    twelfth_percentage DECIMAL(5,2),
    backlogs INTEGER DEFAULT 0,
    placement_eligible BOOLEAN DEFAULT true,
    bio TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Academic semesters
CREATE TABLE semester_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    year INTEGER NOT NULL,
    sgpa DECIMAL(4,2),
    subjects JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, semester, year)
);

-- Skills
CREATE TABLE student_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
    category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, skill_name)
);

-- Companies
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    industry VARCHAR(100),
    website TEXT,
    logo_url TEXT,
    description TEXT,
    hr_contact_name VARCHAR(100),
    hr_contact_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Placement drives
CREATE TABLE placement_drives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    title VARCHAR(200) NOT NULL,
    role VARCHAR(150) NOT NULL,
    package_lpa DECIMAL(6,2),
    description TEXT,
    eligibility_criteria JSONB DEFAULT '{}',
    status drive_status DEFAULT 'upcoming',
    registration_deadline TIMESTAMPTZ,
    drive_date TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resumes
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    version_name VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    is_active BOOLEAN DEFAULT false,
    score DECIMAL(4,1),
    ats_feedback JSONB DEFAULT '{}',
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    technologies TEXT[] DEFAULT '{}',
    github_url TEXT,
    live_url TEXT,
    start_date DATE,
    end_date DATE,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certifications
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    provider VARCHAR(150) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    credential_id VARCHAR(150),
    verification_url TEXT,
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aptitude scores
CREATE TABLE aptitude_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    test_name VARCHAR(150),
    test_date DATE NOT NULL,
    quantitative DECIMAL(5,2),
    logical DECIMAL(5,2),
    verbal DECIMAL(5,2),
    total_score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    percentile DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interview scores
CREATE TABLE interview_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    interview_type VARCHAR(50) DEFAULT 'mock',
    interview_date DATE NOT NULL,
    company VARCHAR(150),
    interviewer_name VARCHAR(100),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 10),
    technical_rating INTEGER CHECK (technical_rating BETWEEN 1 AND 10),
    hr_rating INTEGER CHECK (hr_rating BETWEEN 1 AND 10),
    problem_solving_rating INTEGER CHECK (problem_solving_rating BETWEEN 1 AND 10),
    overall_rating DECIMAL(4,2),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Placement applications
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    drive_id UUID REFERENCES placement_drives(id),
    company_name VARCHAR(200),
    role VARCHAR(150) NOT NULL,
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status application_status DEFAULT 'applied',
    package_offered DECIMAL(6,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics snapshots (cached scores)
CREATE TABLE analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    placement_readiness_score DECIMAL(5,2),
    resume_score DECIMAL(5,2),
    aptitude_score DECIMAL(5,2),
    interview_readiness_score DECIMAL(5,2),
    skills_score DECIMAL(5,2),
    certifications_score DECIMAL(5,2),
    projects_score DECIMAL(5,2),
    strength_areas TEXT[] DEFAULT '{}',
    weak_areas TEXT[] DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_department ON students(department);
CREATE INDEX idx_students_batch_year ON students(batch_year);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_aptitude_student_id ON aptitude_scores(student_id);
CREATE INDEX idx_interview_student_id ON interview_scores(student_id);
CREATE INDEX idx_analytics_student_id ON analytics_snapshots(student_id);
CREATE INDEX idx_resumes_student_id ON resumes(student_id);
CREATE INDEX idx_projects_student_id ON projects(student_id);
CREATE INDEX idx_certs_student_id ON certifications(student_id);
CREATE INDEX idx_drives_company ON placement_drives(company_id);
CREATE INDEX idx_drives_status ON placement_drives(status);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_drives_updated_at BEFORE UPDATE ON placement_drives FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
