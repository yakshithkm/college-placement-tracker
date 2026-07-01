const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const { authValidators, studentValidators, projectValidators, certValidators, aptitudeValidators, interviewValidators, applicationValidators } = require('../middleware/validators');

const authController = require('../controllers/authController');
const studentController = require('../controllers/studentController');
const dataController = require('../controllers/dataController');
const resumeController = require('../controllers/resumeController');
const analyticsController = require('../controllers/analyticsController');
const companyController = require('../controllers/companyController');
const aptitudeTestRoutes = require('./aptitude');

// ======================== AUTH ========================
router.post('/auth/register', authValidators.register, authController.register);
router.post('/auth/login', authValidators.login, authController.login);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', authController.logout);
router.post('/auth/logout-all', authenticate, authController.logoutAll);
router.get('/auth/me', authenticate, authController.getMe);
router.post('/auth/change-password', authenticate, authController.changePassword);

// ======================== STUDENT ========================
router.get('/students/me', authenticate, studentController.getProfile);
router.put('/students/me', authenticate, studentValidators.updateProfile, studentController.updateProfile);
router.get('/students', authenticate, authorize('coordinator', 'admin'), studentController.getAllStudents);
router.get('/students/:userId', authenticate, authorize('coordinator', 'admin'), studentController.getProfile);

// Skills
router.get('/students/me/skills', authenticate, studentController.getSkills);
router.post('/students/me/skills', authenticate, studentController.addSkill);
router.delete('/students/me/skills/:skillId', authenticate, studentController.removeSkill);

// Semester results
router.get('/students/me/semesters', authenticate, studentController.getSemesterResults);
router.post('/students/me/semesters', authenticate, studentController.addSemesterResult);

// ======================== RESUMES ========================
router.get('/resumes', authenticate, resumeController.getResumes);
router.post('/resumes', authenticate, resumeController.uploadMiddleware, resumeController.uploadResume);
router.put('/resumes/:id/activate', authenticate, resumeController.setActiveResume);
router.delete('/resumes/:id', authenticate, resumeController.deleteResume);

// ======================== PROJECTS ========================
router.get('/projects', authenticate, dataController.getProjects);
router.post('/projects', authenticate, projectValidators.create, dataController.createProject);
router.put('/projects/:id', authenticate, dataController.updateProject);
router.delete('/projects/:id', authenticate, dataController.deleteProject);

// ======================== CERTIFICATIONS ========================
router.get('/certifications', authenticate, dataController.getCertifications);
router.post('/certifications', authenticate, certValidators.create, dataController.createCertification);
router.put('/certifications/:id', authenticate, dataController.updateCertification);
router.delete('/certifications/:id', authenticate, dataController.deleteCertification);

// ======================== APTITUDE ========================
router.get('/aptitude', authenticate, dataController.getAptitudeScores);
router.post('/aptitude', authenticate, aptitudeValidators.create, dataController.createAptitudeScore);
router.delete('/aptitude/:id', authenticate, dataController.deleteAptitudeScore);

// ======================== APTITUDE TEST MODULE (quizzes) ========================
// Mounted separately from the legacy manual-score /aptitude routes above.
// Provides categories, question bank, admin test builder, and student attempts.
router.use('/aptitude-test', aptitudeTestRoutes);

// ======================== INTERVIEWS ========================
router.get('/interviews', authenticate, dataController.getInterviewScores);
router.post('/interviews', authenticate, interviewValidators.create, dataController.createInterviewScore);
router.delete('/interviews/:id', authenticate, dataController.deleteInterviewScore);

// ======================== APPLICATIONS ========================
router.get('/applications', authenticate, dataController.getApplications);
router.post('/applications', authenticate, applicationValidators.create, dataController.createApplication);
router.put('/applications/:id', authenticate, dataController.updateApplication);
router.delete('/applications/:id', authenticate, dataController.deleteApplication);

// ======================== ANALYTICS ========================
router.get('/analytics/dashboard', authenticate, analyticsController.getDashboardStats);
router.get('/analytics/me', authenticate, analyticsController.getMyAnalytics);
router.post('/analytics/refresh', authenticate, analyticsController.refreshAnalytics);
router.get('/analytics/coordinator', authenticate, authorize('coordinator', 'admin'), analyticsController.getCoordinatorStats);

// ======================== COMPANIES ========================
router.get('/companies', authenticate, companyController.getCompanies);
router.post('/companies', authenticate, authorize('coordinator', 'admin'), companyController.createCompany);
router.put('/companies/:id', authenticate, authorize('coordinator', 'admin'), companyController.updateCompany);
router.delete('/companies/:id', authenticate, authorize('admin'), companyController.deleteCompany);

// ======================== PLACEMENT DRIVES ========================
router.get('/drives', authenticate, companyController.getDrives);
router.get('/drives/:id', authenticate, companyController.getDriveById);
router.post('/drives', authenticate, authorize('coordinator', 'admin'), companyController.createDrive);
router.put('/drives/:id', authenticate, authorize('coordinator', 'admin'), companyController.updateDrive);
router.delete('/drives/:id', authenticate, authorize('admin'), companyController.deleteDrive);
router.get('/drives/:id/applicants', authenticate, authorize('coordinator', 'admin'), companyController.getDriveApplicants);

module.exports = router;