const { query } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const getStudentId = async (userId) => {
  const result = await query('SELECT id FROM students WHERE user_id = $1', [userId]);
  if (!result.rows[0]) throw new AppError('Student not found', 404);
  return result.rows[0].id;
};

// ======================== PROJECTS ========================

exports.getProjects = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const result = await query(
    'SELECT * FROM projects WHERE student_id = $1 ORDER BY is_featured DESC, created_at DESC',
    [studentId]
  );
  res.json({ success: true, data: result.rows });
});

exports.createProject = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { title, description, technologies, githubUrl, liveUrl, startDate, endDate, isFeatured } = req.body;
  const result = await query(
    `INSERT INTO projects (student_id, title, description, technologies, github_url, live_url, start_date, end_date, is_featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [studentId, title, description, technologies || [], githubUrl, liveUrl, startDate, endDate, isFeatured || false]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

exports.updateProject = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { title, description, technologies, githubUrl, liveUrl, startDate, endDate, isFeatured } = req.body;
  const result = await query(
    `UPDATE projects SET title=$1,description=$2,technologies=$3,github_url=$4,live_url=$5,
     start_date=$6,end_date=$7,is_featured=$8 WHERE id=$9 AND student_id=$10 RETURNING *`,
    [title, description, technologies, githubUrl, liveUrl, startDate, endDate, isFeatured, req.params.id, studentId]
  );
  if (!result.rows[0]) throw new AppError('Project not found', 404);
  res.json({ success: true, data: result.rows[0] });
});

exports.deleteProject = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  await query('DELETE FROM projects WHERE id=$1 AND student_id=$2', [req.params.id, studentId]);
  res.json({ success: true, message: 'Project deleted' });
});

// ======================== CERTIFICATIONS ========================

exports.getCertifications = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const result = await query(
    'SELECT * FROM certifications WHERE student_id = $1 ORDER BY issue_date DESC',
    [studentId]
  );
  res.json({ success: true, data: result.rows });
});

exports.createCertification = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { name, provider, issueDate, expiryDate, credentialId, verificationUrl } = req.body;
  const result = await query(
    `INSERT INTO certifications (student_id, name, provider, issue_date, expiry_date, credential_id, verification_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [studentId, name, provider, issueDate, expiryDate, credentialId, verificationUrl]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

exports.updateCertification = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { name, provider, issueDate, expiryDate, credentialId, verificationUrl } = req.body;
  const result = await query(
    `UPDATE certifications SET name=$1,provider=$2,issue_date=$3,expiry_date=$4,
     credential_id=$5,verification_url=$6 WHERE id=$7 AND student_id=$8 RETURNING *`,
    [name, provider, issueDate, expiryDate, credentialId, verificationUrl, req.params.id, studentId]
  );
  if (!result.rows[0]) throw new AppError('Certification not found', 404);
  res.json({ success: true, data: result.rows[0] });
});

exports.deleteCertification = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  await query('DELETE FROM certifications WHERE id=$1 AND student_id=$2', [req.params.id, studentId]);
  res.json({ success: true, message: 'Certification deleted' });
});

// ======================== APTITUDE SCORES ========================

exports.getAptitudeScores = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const result = await query(
    'SELECT * FROM aptitude_scores WHERE student_id = $1 ORDER BY test_date DESC',
    [studentId]
  );

  const stats = await query(
    `SELECT AVG(quantitative) as avg_quant, AVG(logical) as avg_logical,
            AVG(verbal) as avg_verbal, AVG(total_score/NULLIF(max_score,0)*100) as avg_pct,
            MAX(total_score/NULLIF(max_score,0)*100) as best_pct
     FROM aptitude_scores WHERE student_id = $1`,
    [studentId]
  );

  res.json({ success: true, data: result.rows, stats: stats.rows[0] });
});

exports.createAptitudeScore = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { testName, testDate, quantitative, logical, verbal, totalScore, maxScore, percentile, notes } = req.body;
  const auto_total = totalScore || ((quantitative || 0) + (logical || 0) + (verbal || 0));
  const result = await query(
    `INSERT INTO aptitude_scores (student_id, test_name, test_date, quantitative, logical, verbal, total_score, max_score, percentile, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [studentId, testName, testDate, quantitative, logical, verbal, auto_total, maxScore || 300, percentile, notes]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

exports.deleteAptitudeScore = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  await query('DELETE FROM aptitude_scores WHERE id=$1 AND student_id=$2', [req.params.id, studentId]);
  res.json({ success: true, message: 'Score deleted' });
});

// ======================== INTERVIEW SCORES ========================

exports.getInterviewScores = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const result = await query(
    'SELECT * FROM interview_scores WHERE student_id = $1 ORDER BY interview_date DESC',
    [studentId]
  );

  const stats = await query(
    `SELECT AVG(communication_rating) as avg_comm, AVG(technical_rating) as avg_tech,
            AVG(hr_rating) as avg_hr, AVG(overall_rating) as avg_overall
     FROM interview_scores WHERE student_id = $1`,
    [studentId]
  );

  res.json({ success: true, data: result.rows, stats: stats.rows[0] });
});

exports.createInterviewScore = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { interviewType, interviewDate, company, interviewerName,
          communicationRating, technicalRating, hrRating, problemSolvingRating, feedback } = req.body;
  
  const ratings = [communicationRating, technicalRating, hrRating, problemSolvingRating].filter(Boolean);
  const overallRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  
  const result = await query(
    `INSERT INTO interview_scores (student_id, interview_type, interview_date, company, interviewer_name,
     communication_rating, technical_rating, hr_rating, problem_solving_rating, overall_rating, feedback)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [studentId, interviewType || 'mock', interviewDate, company, interviewerName,
     communicationRating, technicalRating, hrRating, problemSolvingRating, overallRating, feedback]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

exports.deleteInterviewScore = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  await query('DELETE FROM interview_scores WHERE id=$1 AND student_id=$2', [req.params.id, studentId]);
  res.json({ success: true, message: 'Interview record deleted' });
});

// ======================== APPLICATIONS ========================

exports.getApplications = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { status } = req.query;
  const params = [studentId];
  const where = status ? `AND a.status = $2` : '';
  if (status) params.push(status);

  const result = await query(
    `SELECT a.*, c.name as company_full_name, c.logo_url as company_logo, pd.title as drive_title, pd.package_lpa
     FROM applications a
     LEFT JOIN placement_drives pd ON pd.id = a.drive_id
     LEFT JOIN companies c ON c.id = pd.company_id
     WHERE a.student_id = $1 ${where}
     ORDER BY a.applied_date DESC`,
    params
  );

  const stats = await query(
    `SELECT status, COUNT(*) as count FROM applications WHERE student_id = $1 GROUP BY status`,
    [studentId]
  );

  res.json({ success: true, data: result.rows, stats: stats.rows });
});

exports.createApplication = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { driveId, companyName, role, appliedDate, status, notes } = req.body;
  const result = await query(
    `INSERT INTO applications (student_id, drive_id, company_name, role, applied_date, status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [studentId, driveId, companyName, role, appliedDate || new Date(), status || 'applied', notes]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

exports.updateApplication = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { status, notes, packageOffered } = req.body;
  const result = await query(
    `UPDATE applications SET status=COALESCE($1,status), notes=COALESCE($2,notes),
     package_offered=COALESCE($3,package_offered) WHERE id=$4 AND student_id=$5 RETURNING *`,
    [status, notes, packageOffered, req.params.id, studentId]
  );
  if (!result.rows[0]) throw new AppError('Application not found', 404);
  res.json({ success: true, data: result.rows[0] });
});

exports.deleteApplication = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  await query('DELETE FROM applications WHERE id=$1 AND student_id=$2', [req.params.id, studentId]);
  res.json({ success: true, message: 'Application deleted' });
});
