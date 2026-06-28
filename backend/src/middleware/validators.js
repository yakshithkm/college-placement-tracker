const { validationResult, body, param, query } = require('express-validator');
const { AppError } = require('./errorHandler');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => `${e.path}: ${e.msg}`).join('; ');
    return next(new AppError(messages, 400, 'VALIDATION_ERROR'));
  }
  next();
};

const authValidators = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must be 8+ chars with uppercase, lowercase, and number'),
    body('firstName').trim().isLength({ min: 2, max: 100 }).withMessage('First name required (2-100 chars)'),
    body('lastName').trim().isLength({ min: 2, max: 100 }).withMessage('Last name required (2-100 chars)'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
    body('collegeId').optional().trim().isLength({ max: 50 }),
    validate,
  ],
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate,
  ],
};

const studentValidators = {
  updateProfile: [
    body('department').optional().trim().isLength({ max: 100 }),
    body('cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10'),
    body('tenthPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('twelfthPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('linkedinUrl').optional().isURL().withMessage('Valid LinkedIn URL required'),
    body('githubUrl').optional().isURL().withMessage('Valid GitHub URL required'),
    validate,
  ],
};

const projectValidators = {
  create: [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Project title required'),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('technologies').optional().isArray(),
    body('githubUrl').optional().isURL().withMessage('Valid GitHub URL required'),
    body('liveUrl').optional().isURL().withMessage('Valid live URL required'),
    validate,
  ],
};

const certValidators = {
  create: [
    body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Certification name required'),
    body('provider').trim().isLength({ min: 2, max: 150 }).withMessage('Provider name required'),
    body('issueDate').isISO8601().withMessage('Valid issue date required'),
    body('verificationUrl').optional().isURL().withMessage('Valid verification URL required'),
    validate,
  ],
};

const aptitudeValidators = {
  create: [
    body('testDate').isISO8601().withMessage('Valid test date required'),
    body('quantitative').optional().isFloat({ min: 0, max: 100 }),
    body('logical').optional().isFloat({ min: 0, max: 100 }),
    body('verbal').optional().isFloat({ min: 0, max: 100 }),
    validate,
  ],
};

const interviewValidators = {
  create: [
    body('interviewDate').isISO8601().withMessage('Valid interview date required'),
    body('communicationRating').optional().isInt({ min: 1, max: 10 }),
    body('technicalRating').optional().isInt({ min: 1, max: 10 }),
    body('hrRating').optional().isInt({ min: 1, max: 10 }),
    validate,
  ],
};

const applicationValidators = {
  create: [
    body('role').trim().isLength({ min: 2, max: 150 }).withMessage('Role is required'),
    body('appliedDate').optional().isISO8601(),
    validate,
  ],
};

module.exports = {
  validate,
  authValidators,
  studentValidators,
  projectValidators,
  certValidators,
  aptitudeValidators,
  interviewValidators,
  applicationValidators,
};
