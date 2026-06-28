const { query, transaction } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const getStudentId = async (userId) => {
  const result = await query('SELECT id FROM students WHERE user_id = $1', [userId]);
  if (!result.rows[0]) throw new AppError('Student record not found', 404);
  return result.rows[0].id;
};

exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  
  const result = await query(
    `SELECT u.id as user_id, u.email, u.first_name, u.last_name, u.phone, u.college_id, u.avatar_url,
            s.*, 
            (SELECT COUNT(*) FROM projects p WHERE p.student_id = s.id) as project_count,
            (SELECT COUNT(*) FROM certifications c WHERE c.student_id = s.id) as cert_count,
            (SELECT COUNT(*) FROM applications a WHERE a.student_id = s.id) as application_count
     FROM users u
     JOIN students s ON s.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  
  if (!result.rows[0]) throw new AppError('Student not found', 404);
  
  const row = result.rows[0];
  
  const skillsResult = await query(
    'SELECT * FROM student_skills WHERE student_id = $1 ORDER BY category, proficiency_level DESC',
    [row.id]
  );
  
  res.json({
    success: true,
    data: {
      ...row,
      skills: skillsResult.rows,
    },
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, bio, department, batchYear, graduationYear,
          cgpa, tenthPercentage, twelfthPercentage, linkedinUrl, githubUrl, portfolioUrl } = req.body;

  await transaction(async (client) => {
    if (firstName || lastName || phone) {
      await client.query(
        `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
         phone = COALESCE($3, phone) WHERE id = $4`,
        [firstName, lastName, phone, req.user.id]
      );
    }

    await client.query(
      `UPDATE students SET 
        bio = COALESCE($1, bio), department = COALESCE($2, department),
        batch_year = COALESCE($3, batch_year), graduation_year = COALESCE($4, graduation_year),
        cgpa = COALESCE($5, cgpa), tenth_percentage = COALESCE($6, tenth_percentage),
        twelfth_percentage = COALESCE($7, twelfth_percentage), linkedin_url = COALESCE($8, linkedin_url),
        github_url = COALESCE($9, github_url), portfolio_url = COALESCE($10, portfolio_url)
       WHERE user_id = $11`,
      [bio, department, batchYear, graduationYear, cgpa, tenthPercentage, twelfthPercentage, linkedinUrl, githubUrl, portfolioUrl, req.user.id]
    );
  });

  res.json({ success: true, message: 'Profile updated successfully' });
});

exports.getSkills = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const result = await query(
    'SELECT * FROM student_skills WHERE student_id = $1 ORDER BY category, proficiency_level DESC',
    [studentId]
  );
  res.json({ success: true, data: result.rows });
});

exports.addSkill = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { skillName, proficiencyLevel, category } = req.body;
  
  const result = await query(
    `INSERT INTO student_skills (student_id, skill_name, proficiency_level, category)
     VALUES ($1, $2, $3, $4) ON CONFLICT (student_id, skill_name) DO UPDATE
     SET proficiency_level = EXCLUDED.proficiency_level, category = EXCLUDED.category
     RETURNING *`,
    [studentId, skillName, proficiencyLevel || 3, category || 'General']
  );
  
  res.status(201).json({ success: true, data: result.rows[0] });
});

exports.removeSkill = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  await query(
    'DELETE FROM student_skills WHERE id = $1 AND student_id = $2',
    [req.params.skillId, studentId]
  );
  res.json({ success: true, message: 'Skill removed' });
});

exports.getSemesterResults = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const result = await query(
    'SELECT * FROM semester_results WHERE student_id = $1 ORDER BY year, semester',
    [studentId]
  );
  res.json({ success: true, data: result.rows });
});

exports.addSemesterResult = asyncHandler(async (req, res) => {
  const studentId = await getStudentId(req.user.id);
  const { semester, year, sgpa, subjects } = req.body;
  
  const result = await query(
    `INSERT INTO semester_results (student_id, semester, year, sgpa, subjects)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (student_id, semester, year) DO UPDATE SET sgpa = EXCLUDED.sgpa, subjects = EXCLUDED.subjects
     RETURNING *`,
    [studentId, semester, year, sgpa, JSON.stringify(subjects || [])]
  );
  
  res.status(201).json({ success: true, data: result.rows[0] });
});

exports.getAllStudents = asyncHandler(async (req, res) => {
  const { department, batch, search, eligible, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let whereConditions = [];
  let params = [];
  let idx = 1;
  
  if (department) { whereConditions.push(`s.department = $${idx++}`); params.push(department); }
  if (batch) { whereConditions.push(`s.batch_year = $${idx++}`); params.push(parseInt(batch)); }
  if (eligible === 'true') { whereConditions.push(`s.placement_eligible = true`); }
  if (search) {
    whereConditions.push(`(u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx} OR u.email ILIKE $${idx} OR s.roll_number ILIKE $${idx})`);
    params.push(`%${search}%`); idx++;
  }
  
  const where = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  const result = await query(
    `SELECT u.id, u.email, u.first_name, u.last_name, s.id as student_id, s.roll_number,
            s.department, s.batch_year, s.cgpa, s.placement_eligible,
            (SELECT ans.placement_readiness_score FROM analytics_snapshots ans WHERE ans.student_id = s.id ORDER BY ans.calculated_at DESC LIMIT 1) as readiness_score
     FROM users u JOIN students s ON s.user_id = u.id ${where}
     ORDER BY u.first_name LIMIT $${idx} OFFSET $${idx+1}`,
    [...params, parseInt(limit), offset]
  );
  
  const countResult = await query(
    `SELECT COUNT(*) FROM users u JOIN students s ON s.user_id = u.id ${where}`,
    params
  );
  
  res.json({
    success: true,
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(countResult.rows[0].count) },
  });
});
