/**
 * Aptitude Test Module — Controller
 * Handles categories, tests, questions, attempts, and results.
 */
const { query, transaction } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ─── helpers ────────────────────────────────────────────────────────────────

const getStudentId = async (userId) => {
  const r = await query('SELECT id FROM students WHERE user_id = $1', [userId]);
  if (!r.rows[0]) throw new AppError('Student record not found', 404);
  return r.rows[0].id;
};

const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

exports.getCategories = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT c.*, COUNT(q.id) AS question_count, COUNT(t.id) AS test_count
     FROM aptitude_categories c
     LEFT JOIN aptitude_questions q ON q.category_id = c.id
     LEFT JOIN aptitude_tests t ON t.category_id = c.id AND t.is_active = true
     WHERE c.is_active = true
     GROUP BY c.id ORDER BY c.name`
  );
  res.json({ success: true, data: result.rows });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, color } = req.body;
  const result = await query(
    'INSERT INTO aptitude_categories (name, description, icon, color) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, description, icon || '📝', color || '#2563EB']
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, color, isActive } = req.body;
  const result = await query(
    `UPDATE aptitude_categories SET name=COALESCE($1,name), description=COALESCE($2,description),
     icon=COALESCE($3,icon), color=COALESCE($4,color), is_active=COALESCE($5,is_active)
     WHERE id=$6 RETURNING *`,
    [name, description, icon, color, isActive, req.params.id]
  );
  if (!result.rows[0]) throw new AppError('Category not found', 404);
  res.json({ success: true, data: result.rows[0] });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  await query('DELETE FROM aptitude_categories WHERE id=$1', [req.params.id]);
  res.json({ success: true, message: 'Category deleted' });
});

// ─── QUESTIONS ───────────────────────────────────────────────────────────────

exports.getQuestions = asyncHandler(async (req, res) => {
  const { categoryId, difficulty, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conds = [];
  let i = 1;

  if (categoryId) { conds.push(`q.category_id = $${i++}`); params.push(categoryId); }
  if (difficulty)  { conds.push(`q.difficulty = $${i++}`); params.push(difficulty); }
  if (search)      { conds.push(`q.question_text ILIKE $${i++}`); params.push(`%${search}%`); }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const result = await query(
    `SELECT q.*, c.name AS category_name, c.color AS category_color
     FROM aptitude_questions q
     JOIN aptitude_categories c ON c.id = q.category_id
     ${where}
     ORDER BY q.created_at DESC
     LIMIT $${i} OFFSET $${i+1}`,
    [...params, parseInt(limit), offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM aptitude_questions q ${where}`,
    params
  );

  res.json({
    success: true,
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(countResult.rows[0].count) },
  });
});

exports.createQuestion = asyncHandler(async (req, res) => {
  const { categoryId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty, marks, negativeMarks } = req.body;
  const result = await query(
    `INSERT INTO aptitude_questions
      (category_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, marks, negative_marks, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [categoryId, questionText, optionA, optionB, optionC, optionD, correctAnswer.toUpperCase(), explanation, difficulty || 'medium', marks || 1, negativeMarks || 0, req.user.id]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

exports.updateQuestion = asyncHandler(async (req, res) => {
  const { questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty, marks, negativeMarks } = req.body;
  const result = await query(
    `UPDATE aptitude_questions SET
      question_text=COALESCE($1,question_text), option_a=COALESCE($2,option_a),
      option_b=COALESCE($3,option_b), option_c=COALESCE($4,option_c), option_d=COALESCE($5,option_d),
      correct_answer=COALESCE($6,correct_answer), explanation=COALESCE($7,explanation),
      difficulty=COALESCE($8,difficulty), marks=COALESCE($9,marks), negative_marks=COALESCE($10,negative_marks)
     WHERE id=$11 RETURNING *`,
    [questionText, optionA, optionB, optionC, optionD, correctAnswer?.toUpperCase(), explanation, difficulty, marks, negativeMarks, req.params.id]
  );
  if (!result.rows[0]) throw new AppError('Question not found', 404);
  res.json({ success: true, data: result.rows[0] });
});

exports.deleteQuestion = asyncHandler(async (req, res) => {
  await query('DELETE FROM aptitude_questions WHERE id=$1', [req.params.id]);
  res.json({ success: true, message: 'Question deleted' });
});

exports.bulkImportQuestions = asyncHandler(async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) throw new AppError('questions array required', 400);

  const inserted = await transaction(async (client) => {
    const results = [];
    for (const q of questions) {
      const r = await client.query(
        `INSERT INTO aptitude_questions
          (category_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, marks, negative_marks, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
        [q.categoryId, q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.correctAnswer.toUpperCase(), q.explanation, q.difficulty || 'medium', q.marks || 1, q.negativeMarks || 0, req.user.id]
      );
      results.push(r.rows[0].id);
    }
    return results;
  });

  res.status(201).json({ success: true, message: `${inserted.length} questions imported`, data: { ids: inserted } });
});

// ─── TESTS ───────────────────────────────────────────────────────────────────

exports.getTests = asyncHandler(async (req, res) => {
  const { categoryId, active } = req.query;
  const conds = [];
  const params = [];
  let i = 1;

  if (categoryId) { conds.push(`t.category_id = $${i++}`); params.push(categoryId); }
  if (active === 'true') { conds.push('t.is_active = true'); }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : 'WHERE t.is_active = true';

  const result = await query(
    `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
            COUNT(tq.id) AS actual_question_count,
            u.first_name || ' ' || u.last_name AS created_by_name
     FROM aptitude_tests t
     LEFT JOIN aptitude_categories c ON c.id = t.category_id
     LEFT JOIN aptitude_test_questions tq ON tq.test_id = t.id
     LEFT JOIN users u ON u.id = t.created_by
     ${where}
     GROUP BY t.id, c.name, c.icon, c.color, u.first_name, u.last_name
     ORDER BY t.created_at DESC`,
    params
  );
  res.json({ success: true, data: result.rows });
});

exports.getTestById = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
     FROM aptitude_tests t
     LEFT JOIN aptitude_categories c ON c.id = t.category_id
     WHERE t.id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) throw new AppError('Test not found', 404);
  res.json({ success: true, data: result.rows[0] });
});

exports.createTest = asyncHandler(async (req, res) => {
  const { title, description, categoryId, totalQuestions, totalMarks, passingMarks, timerEnabled, durationMinutes, allowPracticeMode, randomizeQuestions, randomizeOptions, questionIds } = req.body;

  const result = await transaction(async (client) => {
    const testResult = await client.query(
      `INSERT INTO aptitude_tests
        (title, description, category_id, total_questions, total_marks, passing_marks, timer_enabled, duration_minutes, allow_practice_mode, randomize_questions, randomize_options, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [title, description, categoryId, totalQuestions || 10, totalMarks || 10, passingMarks || 5, timerEnabled !== false, durationMinutes || 30, allowPracticeMode !== false, randomizeQuestions || false, randomizeOptions || false, req.user.id]
    );
    const test = testResult.rows[0];

    if (questionIds && questionIds.length > 0) {
      for (let idx = 0; idx < questionIds.length; idx++) {
        await client.query(
          'INSERT INTO aptitude_test_questions (test_id, question_id, order_index) VALUES ($1,$2,$3)',
          [test.id, questionIds[idx], idx]
        );
      }
    }
    return test;
  });

  res.status(201).json({ success: true, data: result });
});

exports.updateTest = asyncHandler(async (req, res) => {
  const { title, description, totalMarks, passingMarks, timerEnabled, durationMinutes, allowPracticeMode, isActive } = req.body;
  const result = await query(
    `UPDATE aptitude_tests SET
      title=COALESCE($1,title), description=COALESCE($2,description),
      total_marks=COALESCE($3,total_marks), passing_marks=COALESCE($4,passing_marks),
      timer_enabled=COALESCE($5,timer_enabled), duration_minutes=COALESCE($6,duration_minutes),
      allow_practice_mode=COALESCE($7,allow_practice_mode), is_active=COALESCE($8,is_active)
     WHERE id=$9 RETURNING *`,
    [title, description, totalMarks, passingMarks, timerEnabled, durationMinutes, allowPracticeMode, isActive, req.params.id]
  );
  if (!result.rows[0]) throw new AppError('Test not found', 404);
  res.json({ success: true, data: result.rows[0] });
});

exports.deleteTest = asyncHandler(async (req, res) => {
  await query('DELETE FROM aptitude_tests WHERE id=$1', [req.params.id]);
  res.json({ success: true, message: 'Test deleted' });
});

// ─── ATTEMPTS (STUDENT) ───────────────────────────────────────────────────────

exports.startAttempt = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { testId, mode = 'timed' } = req.body;

  // Prevent duplicate in-progress attempts
  const existing = await query(
    `SELECT id FROM aptitude_attempts WHERE student_id=$1 AND test_id=$2 AND status='in_progress'`,
    [studentId, testId]
  );
  if (existing.rows[0]) {
    // Return existing attempt
    const questions = await _getAttemptQuestions(existing.rows[0].id, testId);
    return res.json({ success: true, data: { attemptId: existing.rows[0].id, questions } });
  }

  const testResult = await query('SELECT * FROM aptitude_tests WHERE id=$1 AND is_active=true', [testId]);
  if (!testResult.rows[0]) throw new AppError('Test not found or inactive', 404);
  const test = testResult.rows[0];

  if (mode === 'timed' && !test.timer_enabled) throw new AppError('This test does not support timed mode', 400);
  if (mode === 'practice' && !test.allow_practice_mode) throw new AppError('Practice mode not allowed for this test', 400);

  // Fetch questions for this test
  let qResult = await query(
    `SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
            q.marks, q.negative_marks, q.difficulty, c.name AS category_name
     FROM aptitude_test_questions tq
     JOIN aptitude_questions q ON q.id = tq.question_id
     JOIN aptitude_categories c ON c.id = q.category_id
     WHERE tq.test_id = $1
     ORDER BY ${test.randomize_questions ? 'RANDOM()' : 'tq.order_index'}`,
    [testId]
  );

  let questions = qResult.rows;
  if (questions.length === 0) throw new AppError('This test has no questions configured', 400);

  const result = await transaction(async (client) => {
    const attemptResult = await client.query(
      `INSERT INTO aptitude_attempts (student_id, test_id, mode, status, total_marks)
       VALUES ($1,$2,$3,'in_progress',$4) RETURNING *`,
      [studentId, testId, mode, test.total_marks]
    );
    const attempt = attemptResult.rows[0];

    // Pre-create answer rows so student can save mid-attempt
    for (const q of questions) {
      await client.query(
        'INSERT INTO aptitude_attempt_answers (attempt_id, question_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [attempt.id, q.id]
      );
    }
    return attempt;
  });

  res.status(201).json({
    success: true,
    data: {
      attemptId: result.id,
      testId,
      mode,
      durationMinutes: mode === 'timed' ? test.duration_minutes : null,
      startedAt: result.started_at,
      questions,
    },
  });
});

async function _getAttemptQuestions(attemptId, testId) {
  const r = await query(
    `SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
            q.marks, q.negative_marks, q.difficulty, c.name AS category_name,
            aa.selected_answer, aa.is_flagged
     FROM aptitude_attempt_answers aa
     JOIN aptitude_questions q ON q.id = aa.question_id
     JOIN aptitude_categories c ON c.id = q.category_id
     WHERE aa.attempt_id = $1`,
    [attemptId]
  );
  return r.rows;
}

exports.saveAnswer = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { attemptId } = req.params;
  const { questionId, selectedAnswer, isFlagged } = req.body;

  // Verify attempt belongs to student
  const attemptCheck = await query(
    `SELECT id, status FROM aptitude_attempts WHERE id=$1 AND student_id=$2`,
    [attemptId, studentId]
  );
  if (!attemptCheck.rows[0]) throw new AppError('Attempt not found', 404);
  if (attemptCheck.rows[0].status !== 'in_progress') throw new AppError('Attempt already submitted', 400);

  await query(
    `UPDATE aptitude_attempt_answers
     SET selected_answer=$1, is_flagged=COALESCE($2,is_flagged), answered_at=NOW()
     WHERE attempt_id=$3 AND question_id=$4`,
    [selectedAnswer || null, isFlagged, attemptId, questionId]
  );

  res.json({ success: true, message: 'Answer saved' });
});

exports.submitAttempt = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { attemptId } = req.params;
  const { timeTakenSeconds } = req.body;

  const attemptCheck = await query(
    `SELECT a.*, t.passing_marks
     FROM aptitude_attempts a
     JOIN aptitude_tests t ON t.id = a.test_id
     WHERE a.id=$1 AND a.student_id=$2 AND a.status='in_progress'`,
    [attemptId, studentId]
  );
  
  if (!attemptCheck.rows[0]) throw new AppError('Attempt not found or already submitted', 404);
  const attempt = attemptCheck.rows[0];

  // Get all answers with correct answers
  const answers = await query(
    `SELECT aa.*, q.correct_answer, q.marks, q.negative_marks
     FROM aptitude_attempt_answers aa
     JOIN aptitude_questions q ON q.id = aa.question_id
     WHERE aa.attempt_id = $1`,
    [attemptId]
  );

  let score = 0, correct = 0, wrong = 0, skipped = 0;

  const updatePromises = answers.rows.map(async (ans) => {
    let isCorrect = null;
    let marksAwarded = 0;

    if (!ans.selected_answer) {
      skipped++;
    } else if (ans.selected_answer === ans.correct_answer) {
      isCorrect = true;
      marksAwarded = parseFloat(ans.marks);
      score += marksAwarded;
      correct++;
    } else {
      isCorrect = false;
      marksAwarded = -parseFloat(ans.negative_marks || 0);
      score += marksAwarded;
      wrong++;
    }

    return query(
      'UPDATE aptitude_attempt_answers SET is_correct=$1, marks_awarded=$2 WHERE id=$3',
      [isCorrect, marksAwarded, ans.id]
    );
  });

  await Promise.all(updatePromises);

  const percentage = attempt.total_marks > 0 ? Math.round((score / attempt.total_marks) * 100 * 10) / 10 : 0;
  const passed = score >= attempt.passing_marks;

  await query(
    `UPDATE aptitude_attempts SET
      status='submitted', submitted_at=NOW(), time_taken_seconds=$1,
      score=$2, correct_count=$3, wrong_count=$4, skipped_count=$5, percentage=$6, passed=$7
     WHERE id=$8`,
    [timeTakenSeconds, Math.max(score, 0), correct, wrong, skipped, percentage, passed, attemptId]
  );

  // Update placement readiness analytics
  try {
    const { calculateReadinessScore } = require('./analyticsController');
    await calculateReadinessScore(studentId);
  } catch (e) { /* non-fatal */ }

  res.json({
    success: true,
    data: {
      attemptId,
      score: Math.max(score, 0),
      totalMarks: attempt.total_marks,
      correct,
      wrong,
      skipped,
      percentage,
      passed,
      timeTakenSeconds,
    },
  });
});

exports.getAttemptResult = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { attemptId } = req.params;

  const attemptResult = await query(
    `SELECT a.*, t.title AS test_title, t.passing_marks, t.duration_minutes,
            c.name AS category_name, c.color AS category_color
     FROM aptitude_attempts a
     JOIN aptitude_tests t ON t.id = a.test_id
     LEFT JOIN aptitude_categories c ON c.id = t.category_id
     WHERE a.id=$1 AND a.student_id=$2`,
    [attemptId, studentId]
  );
  if (!attemptResult.rows[0]) throw new AppError('Result not found', 404);

  const answers = await query(
    `SELECT aa.*, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
            q.correct_answer, q.explanation, q.marks, q.difficulty,
            c.name AS category_name
     FROM aptitude_attempt_answers aa
     JOIN aptitude_questions q ON q.id = aa.question_id
     JOIN aptitude_categories c ON c.id = q.category_id
     WHERE aa.attempt_id = $1
     ORDER BY q.difficulty`,
    [attemptId]
  );

  // Category-wise breakdown
  const categoryStats = {};
  answers.rows.forEach(ans => {
    if (!categoryStats[ans.category_name]) {
      categoryStats[ans.category_name] = { correct: 0, wrong: 0, skipped: 0, total: 0, marks: 0 };
    }
    const cat = categoryStats[ans.category_name];
    cat.total++;
    cat.marks += parseFloat(ans.marks || 0);
    if (!ans.selected_answer) cat.skipped++;
    else if (ans.is_correct) cat.correct++;
    else cat.wrong++;
  });

  res.json({
    success: true,
    data: {
      attempt: attemptResult.rows[0],
      answers: answers.rows,
      categoryBreakdown: categoryStats,
    },
  });
});

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

exports.getMyAttempts = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);

  const attempts = await query(
    `SELECT a.*, t.title AS test_title, t.total_questions,
            c.name AS category_name, c.color AS category_color, c.icon AS category_icon
     FROM aptitude_attempts a
     JOIN aptitude_tests t ON t.id = a.test_id
     LEFT JOIN aptitude_categories c ON c.id = t.category_id
     WHERE a.student_id=$1 AND a.status != 'in_progress'
     ORDER BY a.submitted_at DESC`,
    [studentId]
  );

  const stats = await query(
    `SELECT
       COUNT(*) AS total_attempts,
       AVG(percentage) AS avg_score,
       MAX(percentage) AS best_score,
       MIN(percentage) AS lowest_score,
       SUM(CASE WHEN passed THEN 1 ELSE 0 END) AS passed_count
     FROM aptitude_attempts
     WHERE student_id=$1 AND status='submitted'`,
    [studentId]
  );

  // Trend data
  const trend = await query(
    `SELECT a.id, a.percentage, a.score, a.submitted_at, t.title
     FROM aptitude_attempts a
     JOIN aptitude_tests t ON t.id = a.test_id
     WHERE a.student_id=$1 AND a.status='submitted'
     ORDER BY a.submitted_at ASC LIMIT 20`,
    [studentId]
  );

  res.json({
    success: true,
    data: {
      attempts: attempts.rows,
      stats: stats.rows[0],
      trend: trend.rows,
    },
  });
});

exports.getAdminStats = asyncHandler(async (req, res) => {
  const [totalTests, totalQuestions, totalAttempts, avgScore, topTests] = await Promise.all([
    query('SELECT COUNT(*) FROM aptitude_tests WHERE is_active=true'),
    query('SELECT COUNT(*) FROM aptitude_questions'),
    query("SELECT COUNT(*) FROM aptitude_attempts WHERE status='submitted'"),
    query("SELECT AVG(percentage) FROM aptitude_attempts WHERE status='submitted'"),
    query(`SELECT t.title, COUNT(a.id) AS attempts, AVG(a.percentage) AS avg_score
           FROM aptitude_tests t
           LEFT JOIN aptitude_attempts a ON a.test_id = t.id AND a.status='submitted'
           GROUP BY t.id ORDER BY attempts DESC LIMIT 5`),
  ]);

  res.json({
    success: true,
    data: {
      totalTests: parseInt(totalTests.rows[0].count),
      totalQuestions: parseInt(totalQuestions.rows[0].count),
      totalAttempts: parseInt(totalAttempts.rows[0].count),
      avgScore: parseFloat(avgScore.rows[0].avg || 0).toFixed(1),
      topTests: topTests.rows,
    },
  });
});