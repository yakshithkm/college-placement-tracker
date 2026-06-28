const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { query } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume_${req.user.id}_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new AppError('Only PDF files are allowed', 400), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
});

exports.uploadMiddleware = upload.single('resume');

const getStudentId = async (userId) => {
  const r = await query('SELECT id FROM students WHERE user_id = $1', [userId]);
  if (!r.rows[0]) throw new AppError('Student not found', 404);
  return r.rows[0].id;
};

exports.getResumes = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const result = await query(
    'SELECT id, version_name, file_url, file_size, is_active, score, uploaded_at FROM resumes WHERE student_id = $1 ORDER BY uploaded_at DESC',
    [studentId]
  );
  res.json({ success: true, data: result.rows });
});

exports.uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Resume file is required', 400);
  const studentId = await getStudentId(req.user.id);
  const versionName = req.body.versionName || `Resume v${Date.now()}`;
  const fileUrl = `/uploads/${req.file.filename}`;

  const result = await query(
    `INSERT INTO resumes (student_id, version_name, file_url, file_size, is_active)
     VALUES ($1, $2, $3, $4, false) RETURNING *`,
    [studentId, versionName, fileUrl, req.file.size]
  );
  res.status(201).json({ success: true, data: result.rows[0], message: 'Resume uploaded successfully' });
});

exports.setActiveResume = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  await query('UPDATE resumes SET is_active = false WHERE student_id = $1', [studentId]);
  const result = await query(
    'UPDATE resumes SET is_active = true WHERE id = $1 AND student_id = $2 RETURNING *',
    [req.params.id, studentId]
  );
  if (!result.rows[0]) throw new AppError('Resume not found', 404);
  res.json({ success: true, data: result.rows[0], message: 'Active resume set' });
});

exports.deleteResume = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const result = await query(
    'DELETE FROM resumes WHERE id = $1 AND student_id = $2 RETURNING file_url',
    [req.params.id, studentId]
  );
  if (result.rows[0]) {
    const filePath = path.join(uploadDir, path.basename(result.rows[0].file_url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  res.json({ success: true, message: 'Resume deleted' });
});
