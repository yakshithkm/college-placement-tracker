-- Seed data for College Placement Tracker

-- Admin user (password: Admin@123 - bcrypt hash)
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, college_id, email_verified)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@college.edu',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK3udZ1W.',
    'admin', 'System', 'Admin', '9000000001', 'ADMIN001', true
);

-- Coordinator user (password: Coord@123)
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, college_id, email_verified)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'coordinator@college.edu',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK3udZ1W.',
    'coordinator', 'Placement', 'Coordinator', '9000000002', 'COORD001', true
);

-- Demo student (password: Student@123)
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, college_id, email_verified)
VALUES (
    'a0000000-0000-0000-0000-000000000003',
    'student@college.edu',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK3udZ1W.',
    'student', 'Optimus', 'Prime', '9876543210', 'CS2021001', true
);

INSERT INTO students (id, user_id, roll_number, department, batch_year, graduation_year, cgpa, tenth_percentage, twelfth_percentage, bio, linkedin_url, github_url)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'CS21001', 'Computer Science and Engineering', 2021, 2025, 8.75, 92.5, 88.0,
    'Full-stack developer passionate about building scalable web applications.',
    'https://linkedin.com/in/optimus-prime', 'https://github.com/optimus-prime'
);

-- Sample companies
INSERT INTO companies (id, name, industry, website, description)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'TechCorp Solutions', 'Information Technology', 'https://techcorp.com', 'Leading IT solutions provider'),
    ('c0000000-0000-0000-0000-000000000002', 'DataMinds Analytics', 'Data Analytics', 'https://dataminds.io', 'Data-driven insights company'),
    ('c0000000-0000-0000-0000-000000000003', 'CloudBase Systems', 'Cloud Computing', 'https://cloudbase.dev', 'Cloud infrastructure specialists'),
    ('c0000000-0000-0000-0000-000000000004', 'FinEdge Technologies', 'FinTech', 'https://finedge.com', 'Financial technology innovators');

-- Sample placement drives
INSERT INTO placement_drives (company_id, title, role, package_lpa, description, status, registration_deadline, drive_date, created_by)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'TechCorp Campus Drive 2025', 'Software Engineer', 8.50, 'Full-stack developer role. 3 rounds: Online test, Technical interview, HR.', 'active', NOW() + INTERVAL '10 days', NOW() + INTERVAL '20 days', 'a0000000-0000-0000-0000-000000000002'),
    ('c0000000-0000-0000-0000-000000000002', 'DataMinds Hiring 2025', 'Data Analyst', 7.00, 'Analytics and visualization role. Python and SQL required.', 'active', NOW() + INTERVAL '3 days', NOW() + INTERVAL '15 days', 'a0000000-0000-0000-0000-000000000002'),
    ('c0000000-0000-0000-0000-000000000003', 'CloudBase Internship 2025', 'Cloud Engineer Intern', 5.00, '6-month internship with PPO. AWS/GCP knowledge preferred.', 'upcoming', NOW() + INTERVAL '20 days', NOW() + INTERVAL '35 days', 'a0000000-0000-0000-0000-000000000002'),
    ('c0000000-0000-0000-0000-000000000004', 'FinEdge Graduate Program', 'Associate Developer', 9.00, 'Graduate program for top performers. Full-stack + finance domain.', 'upcoming', NOW() + INTERVAL '30 days', NOW() + INTERVAL '45 days', 'a0000000-0000-0000-0000-000000000002');

-- Student skills
INSERT INTO student_skills (student_id, skill_name, proficiency_level, category)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'JavaScript', 4, 'Programming'),
    ('b0000000-0000-0000-0000-000000000001', 'TypeScript', 3, 'Programming'),
    ('b0000000-0000-0000-0000-000000000001', 'React.js', 4, 'Frontend'),
    ('b0000000-0000-0000-0000-000000000001', 'Node.js', 3, 'Backend'),
    ('b0000000-0000-0000-0000-000000000001', 'Express.js', 3, 'Backend'),
    ('b0000000-0000-0000-0000-000000000001', 'PostgreSQL', 3, 'Database'),
    ('b0000000-0000-0000-0000-000000000001', 'Docker', 2, 'DevOps'),
    ('b0000000-0000-0000-0000-000000000001', 'Git', 4, 'Tools'),
    ('b0000000-0000-0000-0000-000000000001', 'Python', 3, 'Programming');

-- Sample projects
INSERT INTO projects (student_id, title, description, technologies, github_url, is_featured)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'College Placement Tracker', 'Full-stack placement readiness platform with analytics, resume management, and drive tracking.', ARRAY['React.js', 'Node.js', 'PostgreSQL', 'Docker'], 'https://github.com/optimus-prime/placement-tracker', true),
    ('b0000000-0000-0000-0000-000000000001', 'E-Commerce Platform', 'Multi-vendor shopping platform with cart, orders, and payment integration.', ARRAY['React.js', 'Express.js', 'MongoDB', 'Stripe'], 'https://github.com/optimus-prime/ecommerce', false);

-- Sample certifications
INSERT INTO certifications (student_id, name, provider, issue_date, verification_url)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'React Developer Certification', 'Meta', '2024-03-15', 'https://certificates.meta.com/verify/abc123'),
    ('b0000000-0000-0000-0000-000000000001', 'AWS Cloud Practitioner', 'Amazon Web Services', '2024-01-10', 'https://aws.amazon.com/verify/xyz456');

-- Sample aptitude scores
INSERT INTO aptitude_scores (student_id, test_name, test_date, quantitative, logical, verbal, total_score, max_score, percentile)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'TCS NQT Mock 1', '2024-10-01', 72, 68, 75, 215, 300, 78),
    ('b0000000-0000-0000-0000-000000000001', 'TCS NQT Mock 2', '2024-11-15', 80, 74, 78, 232, 300, 85),
    ('b0000000-0000-0000-0000-000000000001', 'Infosys Aptitude', '2024-12-01', 85, 80, 82, 247, 300, 91);

-- Sample interview scores
INSERT INTO interview_scores (student_id, interview_type, interview_date, company, communication_rating, technical_rating, hr_rating, problem_solving_rating, overall_rating, feedback)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'mock', '2024-10-20', 'Mock Round 1', 7, 6, 8, 6, 6.75, 'Good communication. Needs to improve data structures knowledge.'),
    ('b0000000-0000-0000-0000-000000000001', 'mock', '2024-11-25', 'Mock Round 2', 8, 7, 9, 7, 7.75, 'Improved significantly. Work on system design concepts.');

-- Sample applications
INSERT INTO applications (student_id, company_name, role, applied_date, status)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Infosys', 'Systems Engineer', '2024-09-01', 'test_cleared'),
    ('b0000000-0000-0000-0000-000000000001', 'Wipro', 'Project Engineer', '2024-09-15', 'interview_scheduled'),
    ('b0000000-0000-0000-0000-000000000001', 'Cognizant', 'Programmer Analyst', '2024-10-01', 'applied');

-- Semester results
INSERT INTO semester_results (student_id, semester, year, sgpa)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 1, 2021, 8.4),
    ('b0000000-0000-0000-0000-000000000001', 2, 2022, 8.6),
    ('b0000000-0000-0000-0000-000000000001', 3, 2022, 8.8),
    ('b0000000-0000-0000-0000-000000000001', 4, 2023, 9.0),
    ('b0000000-0000-0000-0000-000000000001', 5, 2023, 8.7),
    ('b0000000-0000-0000-0000-000000000001', 6, 2024, 8.9);
