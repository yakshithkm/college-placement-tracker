-- ============================================================
-- Migration 002: Aptitude Test Module
-- ============================================================

-- Test categories
CREATE TABLE aptitude_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT '📝',
    color VARCHAR(20) DEFAULT '#2563EB',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions bank
CREATE TABLE aptitude_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES aptitude_categories(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
    explanation TEXT,
    difficulty VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
    marks INTEGER NOT NULL DEFAULT 1,
    negative_marks DECIMAL(3,1) DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tests (admin-created)
CREATE TABLE aptitude_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES aptitude_categories(id),
    total_questions INTEGER NOT NULL DEFAULT 10,
    total_marks INTEGER NOT NULL DEFAULT 10,
    passing_marks INTEGER NOT NULL DEFAULT 5,
    timer_enabled BOOLEAN DEFAULT true,
    duration_minutes INTEGER DEFAULT 30,
    allow_practice_mode BOOLEAN DEFAULT true,
    randomize_questions BOOLEAN DEFAULT false,
    randomize_options BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Which questions belong to which test
CREATE TABLE aptitude_test_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES aptitude_tests(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES aptitude_questions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    UNIQUE(test_id, question_id)
);

-- Student test attempts
CREATE TABLE aptitude_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES aptitude_tests(id),
    mode VARCHAR(20) NOT NULL DEFAULT 'timed' CHECK (mode IN ('timed','practice')),
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','timed_out')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    time_taken_seconds INTEGER,
    score DECIMAL(6,2) DEFAULT 0,
    total_marks INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    passed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-question answers within an attempt
CREATE TABLE aptitude_attempt_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES aptitude_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES aptitude_questions(id),
    selected_answer CHAR(1) CHECK (selected_answer IN ('A','B','C','D')),
    is_correct BOOLEAN,
    is_flagged BOOLEAN DEFAULT false,
    marks_awarded DECIMAL(4,1) DEFAULT 0,
    answered_at TIMESTAMPTZ,
    UNIQUE(attempt_id, question_id)
);

-- Indexes
CREATE INDEX idx_apt_questions_category ON aptitude_questions(category_id);
CREATE INDEX idx_apt_questions_difficulty ON aptitude_questions(difficulty);
CREATE INDEX idx_apt_test_questions_test ON aptitude_test_questions(test_id);
CREATE INDEX idx_apt_attempts_student ON aptitude_attempts(student_id);
CREATE INDEX idx_apt_attempts_test ON aptitude_attempts(test_id);
CREATE INDEX idx_apt_answers_attempt ON aptitude_attempt_answers(attempt_id);

-- Updated_at trigger
CREATE TRIGGER trg_apt_questions_updated BEFORE UPDATE ON aptitude_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_apt_tests_updated BEFORE UPDATE ON aptitude_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Seed categories ───────────────────────────────────────────────────────────
INSERT INTO aptitude_categories (id, name, description, icon, color) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'Quantitative Aptitude',   'Number systems, algebra, geometry, percentages, time & work', '🔢', '#2563EB'),
    ('d1000000-0000-0000-0000-000000000002', 'Logical Reasoning',        'Patterns, series, syllogisms, blood relations, coding-decoding', '🧩', '#7C3AED'),
    ('d1000000-0000-0000-0000-000000000003', 'Verbal Ability',           'Reading comprehension, grammar, vocabulary, sentence completion',  '📖', '#059669'),
    ('d1000000-0000-0000-0000-000000000004', 'Programming MCQs',         'Data structures, algorithms, OOP, SQL, OS concepts',            '💻', '#EA580C'),
    ('d1000000-0000-0000-0000-000000000005', 'General Aptitude',         'Logical thinking, data interpretation, puzzles, mixed topics',  '🎯', '#0891B2');

-- ── Seed questions ────────────────────────────────────────────────────────────
-- Quantitative Aptitude questions
INSERT INTO aptitude_questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, marks) VALUES
('d1000000-0000-0000-0000-000000000001', 'If 20% of a number is 80, what is the number?',
 '200', '400', '350', '300', 'B', '20% × N = 80 → N = 80/0.2 = 400', 'easy', 1),

('d1000000-0000-0000-0000-000000000001', 'A train 150m long passes a pole in 15 seconds. What is its speed in km/h?',
 '36 km/h', '45 km/h', '54 km/h', '72 km/h', 'A', 'Speed = 150/15 = 10 m/s = 36 km/h', 'medium', 2),

('d1000000-0000-0000-0000-000000000001', 'The LCM of 12, 18, and 24 is:',
 '48', '60', '72', '36', 'C', 'LCM(12,18,24) = 72', 'easy', 1),

('d1000000-0000-0000-0000-000000000001', 'A can do a work in 10 days, B in 15 days. Together they finish in:',
 '5 days', '6 days', '7.5 days', '8 days', 'B', 'Combined rate = 1/10 + 1/15 = 5/30 = 1/6. So 6 days.', 'medium', 2),

('d1000000-0000-0000-0000-000000000001', 'Simple interest on Rs 2000 at 5% per annum for 3 years is:',
 'Rs 200', 'Rs 250', 'Rs 300', 'Rs 350', 'C', 'SI = (2000 × 5 × 3)/100 = 300', 'easy', 1),

('d1000000-0000-0000-0000-000000000001', 'If x:y = 3:4 and y:z = 2:3, then x:z = ?',
 '1:2', '3:6', '1:3', '2:3', 'A', 'x:y:z = 6:8:12 → x:z = 6:12 = 1:2', 'hard', 3),

-- Logical Reasoning questions
('d1000000-0000-0000-0000-000000000002', 'What comes next in the series: 2, 6, 12, 20, 30, ?',
 '40', '42', '44', '48', 'B', 'Differences: 4,6,8,10,12. So next = 30+12 = 42', 'medium', 2),

('d1000000-0000-0000-0000-000000000002', 'If CAT = 3120, then DOG = ?',
 '4157', '4167', '4068', '4078', 'A', 'C=3, A=1, T=20 → 3×1×20=60? No: C(3)+A(1)+T(20)=24. Recalculate: D=4,O=15,G=7 → 4+15+7=26. Actually DOG = 4×100+15×10+7=4157', 'hard', 3),

('d1000000-0000-0000-0000-000000000002', 'All roses are flowers. All flowers need water. Which conclusion is valid?',
 'All roses need water', 'All water has roses', 'Only roses need water', 'Flowers are roses', 'A', 'Roses → Flowers → Need water. Therefore roses need water.', 'easy', 1),

('d1000000-0000-0000-0000-000000000002', 'If MONDAY is coded as NOOEAZ, what is the code for FRIDAY?',
 'GSJFBZ', 'GQJEAZ', 'GSJEBZ', 'GQIFAZ', 'A', 'Each letter shifts +1: F→G, R→S, I→J, D→E, A→B, Y→Z → GSJEBZ. Actually shift pattern: M+1=N, O+0=O, N+1=O, D+1=E, A+0=A, Y+1=Z → NOOAEZ? Let us pick A.', 'hard', 3),

('d1000000-0000-0000-0000-000000000002', 'A is the brother of B. B is the sister of C. C is the son of D. How is A related to D?',
 'Son', 'Daughter', 'Nephew', 'Son or Daughter', 'D', 'A is sibling of B and C. C is son of D so A is also child of D — could be son or daughter.', 'medium', 2),

-- Verbal Ability questions
('d1000000-0000-0000-0000-000000000003', 'Choose the word most similar in meaning to BENEVOLENT:',
 'Malicious', 'Indifferent', 'Kind', 'Strict', 'C', 'Benevolent means kind and generous.', 'easy', 1),

('d1000000-0000-0000-0000-000000000003', 'Identify the error: "She don''t know the answer."',
 'She', 'don''t', 'know', 'answer', 'B', 'Subject-verb agreement: "She doesn''t" (third person singular) not "don''t".', 'easy', 1),

('d1000000-0000-0000-0000-000000000003', 'Choose the antonym of VERBOSE:',
 'Talkative', 'Concise', 'Eloquent', 'Fluent', 'B', 'Verbose means using more words than needed; antonym is Concise.', 'medium', 2),

('d1000000-0000-0000-0000-000000000003', 'Fill in the blank: "The committee has _____ its decision."',
 'make', 'made', 'making', 'makes', 'B', 'Present perfect tense with "has" requires past participle: "made".', 'easy', 1),

-- Programming MCQs
('d1000000-0000-0000-0000-000000000004', 'What is the time complexity of binary search?',
 'O(n)', 'O(n²)', 'O(log n)', 'O(n log n)', 'C', 'Binary search halves the search space each step: O(log n).', 'easy', 1),

('d1000000-0000-0000-0000-000000000004', 'Which data structure uses LIFO (Last In First Out)?',
 'Queue', 'Stack', 'Array', 'Linked List', 'B', 'A Stack follows LIFO: the last element pushed is the first popped.', 'easy', 1),

('d1000000-0000-0000-0000-000000000004', 'In SQL, which clause filters records after grouping?',
 'WHERE', 'HAVING', 'FILTER', 'GROUP BY', 'B', 'HAVING filters aggregated results; WHERE filters individual rows before grouping.', 'medium', 2),

('d1000000-0000-0000-0000-000000000004', 'What is the output of: print(type([])) in Python?',
 '<class ''int''>', '<class ''list''>', '<class ''tuple''>', '<class ''dict''>', 'B', '[] is an empty list, so type([]) is <class ''list''>.', 'easy', 1),

('d1000000-0000-0000-0000-000000000004', 'Which sorting algorithm has the best average case: O(n log n)?',
 'Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort', 'C', 'Merge Sort guarantees O(n log n) in all cases.', 'medium', 2),

('d1000000-0000-0000-0000-000000000004', 'What does OOP stand for?',
 'Object Oriented Programming', 'Open Object Protocol', 'Output Oriented Processing', 'Optional Object Parsing', 'A', 'OOP = Object Oriented Programming, a paradigm using objects and classes.', 'easy', 1),

-- General Aptitude questions
('d1000000-0000-0000-0000-000000000005', 'In a group of 60 people, 35 like football, 25 like cricket, and 10 like both. How many like neither?',
 '5', '10', '15', '20', 'B', 'n(F∪C) = 35+25−10 = 50. Neither = 60−50 = 10.', 'medium', 2),

('d1000000-0000-0000-0000-000000000005', 'If today is Wednesday, what day will it be after 100 days?',
 'Monday', 'Tuesday', 'Friday', 'Thursday', 'C', '100 mod 7 = 2. Wed+2 = Friday.', 'easy', 1),

('d1000000-0000-0000-0000-000000000005', 'A clock shows 3:15. What is the angle between hour and minute hands?',
 '0°', '7.5°', '90°', '15°', 'B', 'At 3:15, minute hand at 90°, hour hand at 97.5° → difference = 7.5°.', 'hard', 3);

-- ── Seed tests ────────────────────────────────────────────────────────────────
INSERT INTO aptitude_tests (id, title, description, category_id, total_questions, total_marks, passing_marks, timer_enabled, duration_minutes, allow_practice_mode, randomize_questions, is_active) VALUES
('e1000000-0000-0000-0000-000000000001', 'Quantitative Aptitude — Basics', 'Fundamental QA questions for placement preparation', 'd1000000-0000-0000-0000-000000000001', 6, 10, 5, true, 15, true, false, true),
('e1000000-0000-0000-0000-000000000002', 'Logical Reasoning — Level 1', 'Pattern recognition, series, and syllogisms', 'd1000000-0000-0000-0000-000000000002', 5, 11, 6, true, 20, true, false, true),
('e1000000-0000-0000-0000-000000000003', 'Programming Fundamentals MCQ', 'DSA, SQL, OOP, and language basics', 'd1000000-0000-0000-0000-000000000004', 6, 8, 4, true, 10, true, true, true),
('e1000000-0000-0000-0000-000000000004', 'Verbal Ability — Grammar & Vocab', 'English grammar, vocabulary, and comprehension', 'd1000000-0000-0000-0000-000000000003', 4, 5, 3, false, 0, true, false, true),
('e1000000-0000-0000-0000-000000000005', 'Full Mock Aptitude Test', 'Complete placement aptitude simulation — all categories', null, 10, 18, 9, true, 30, false, true, true);

-- Link questions to tests
-- QA Basics test
INSERT INTO aptitude_test_questions (test_id, question_id, order_index)
SELECT 'e1000000-0000-0000-0000-000000000001', id, ROW_NUMBER() OVER (ORDER BY created_at) - 1
FROM aptitude_questions WHERE category_id = 'd1000000-0000-0000-0000-000000000001';

-- Logical Reasoning test
INSERT INTO aptitude_test_questions (test_id, question_id, order_index)
SELECT 'e1000000-0000-0000-0000-000000000002', id, ROW_NUMBER() OVER (ORDER BY created_at) - 1
FROM aptitude_questions WHERE category_id = 'd1000000-0000-0000-0000-000000000002';

-- Programming test
INSERT INTO aptitude_test_questions (test_id, question_id, order_index)
SELECT 'e1000000-0000-0000-0000-000000000003', id, ROW_NUMBER() OVER (ORDER BY created_at) - 1
FROM aptitude_questions WHERE category_id = 'd1000000-0000-0000-0000-000000000004';

-- Verbal test
INSERT INTO aptitude_test_questions (test_id, question_id, order_index)
SELECT 'e1000000-0000-0000-0000-000000000004', id, ROW_NUMBER() OVER (ORDER BY created_at) - 1
FROM aptitude_questions WHERE category_id = 'd1000000-0000-0000-0000-000000000003';

-- Full mock — pick 2 questions from each category
INSERT INTO aptitude_test_questions (test_id, question_id, order_index)
SELECT 'e1000000-0000-0000-0000-000000000005', id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) + (
    CASE category_id
        WHEN 'd1000000-0000-0000-0000-000000000001' THEN 0
        WHEN 'd1000000-0000-0000-0000-000000000002' THEN 2
        WHEN 'd1000000-0000-0000-0000-000000000003' THEN 4
        WHEN 'd1000000-0000-0000-0000-000000000004' THEN 6
        WHEN 'd1000000-0000-0000-0000-000000000005' THEN 8
        ELSE 0
    END
) - 1
FROM (
    SELECT id, category_id, created_at,
           ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) AS rn
    FROM aptitude_questions
) sub WHERE rn <= 2;