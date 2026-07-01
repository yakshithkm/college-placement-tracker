const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const c = require('../controllers/aptitudeTestController');

// ── Categories ──────────────────────────────────────────────────────────────
router.get('/categories', authenticate, c.getCategories);
router.post('/categories', authenticate, authorize('admin', 'coordinator'), c.createCategory);
router.put('/categories/:id', authenticate, authorize('admin', 'coordinator'), c.updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), c.deleteCategory);

// ── Questions ───────────────────────────────────────────────────────────────
router.get('/questions', authenticate, authorize('admin', 'coordinator'), c.getQuestions);
router.post('/questions', authenticate, authorize('admin', 'coordinator'), c.createQuestion);
router.put('/questions/:id', authenticate, authorize('admin', 'coordinator'), c.updateQuestion);
router.delete('/questions/:id', authenticate, authorize('admin', 'coordinator'), c.deleteQuestion);
router.post('/questions/bulk-import', authenticate, authorize('admin', 'coordinator'), c.bulkImportQuestions);

// ── Tests ────────────────────────────────────────────────────────────────────
router.get('/tests', authenticate, c.getTests);
router.get('/tests/:id', authenticate, c.getTestById);
router.post('/tests', authenticate, authorize('admin', 'coordinator'), c.createTest);
router.put('/tests/:id', authenticate, authorize('admin', 'coordinator'), c.updateTest);
router.delete('/tests/:id', authenticate, authorize('admin'), c.deleteTest);

// ── Attempts (student) ───────────────────────────────────────────────────────
router.post('/attempt/start', authenticate, authorize('student'), c.startAttempt);
router.put('/attempt/:attemptId/answer', authenticate, authorize('student'), c.saveAnswer);
router.post('/attempt/:attemptId/submit', authenticate, authorize('student'), c.submitAttempt);
router.get('/attempt/:attemptId/result', authenticate, c.getAttemptResult);

// ── Analytics ────────────────────────────────────────────────────────────────
router.get('/my-attempts', authenticate, authorize('student'), c.getMyAttempts);
router.get('/admin/stats', authenticate, authorize('admin', 'coordinator'), c.getAdminStats);

module.exports = router;