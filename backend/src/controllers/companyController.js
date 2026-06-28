const { query } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ======================== COMPANIES ========================
exports.getCompanies = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  let where = '';
  if (search) {
    where = 'WHERE name ILIKE $1 OR industry ILIKE $1';
    params.push(`%${search}%`);
  }
  const result = await query(
    `SELECT *, (SELECT COUNT(*) FROM placement_drives pd WHERE pd.company_id = companies.id) as drive_count
     FROM companies ${where} ORDER BY name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, parseInt(limit), offset]
  );
  res.json({ success: true, data: result.rows });
});

exports.createCompany = asyncHandler(async (req, res) => {
  const { name, industry, website, description, hrContactName, hrContactEmail } = req.body;
  const result = await query(
    `INSERT INTO companies (name, industry, website, description, hr_contact_name, hr_contact_email)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [name, industry, website, description, hrContactName, hrContactEmail]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

exports.updateCompany = asyncHandler(async (req, res) => {
  const { name, industry, website, description, hrContactName, hrContactEmail } = req.body;
  const result = await query(
    `UPDATE companies SET name=COALESCE($1,name), industry=COALESCE($2,industry),
     website=COALESCE($3,website), description=COALESCE($4,description),
     hr_contact_name=COALESCE($5,hr_contact_name), hr_contact_email=COALESCE($6,hr_contact_email)
     WHERE id=$7 RETURNING *`,
    [name, industry, website, description, hrContactName, hrContactEmail, req.params.id]
  );
  if (!result.rows[0]) throw new AppError('Company not found', 404);
  res.json({ success: true, data: result.rows[0] });
});

exports.deleteCompany = asyncHandler(async (req, res) => {
  await query('DELETE FROM companies WHERE id = $1', [req.params.id]);
  res.json({ success: true, message: 'Company deleted' });
});

// ======================== PLACEMENT DRIVES ========================
exports.getDrives = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  let where = '';
  if (status) { where = 'WHERE pd.status = $1'; params.push(status); }

  const result = await query(
    `SELECT pd.*, c.name as company_name, c.logo_url, c.industry,
            COUNT(a.id) as application_count
     FROM placement_drives pd
     JOIN companies c ON c.id = pd.company_id
     LEFT JOIN applications a ON a.drive_id = pd.id
     ${where}
     GROUP BY pd.id, c.name, c.logo_url, c.industry
     ORDER BY pd.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, parseInt(limit), offset]
  );
  res.json({ success: true, data: result.rows });
});

exports.getDriveById = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT pd.*, c.name as company_name, c.logo_url, c.industry, c.website, c.description as company_description
     FROM placement_drives pd JOIN companies c ON c.id = pd.company_id WHERE pd.id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) throw new AppError('Drive not found', 404);
  res.json({ success: true, data: result.rows[0] });
});

exports.createDrive = asyncHandler(async (req, res) => {
  const { companyId, title, role, packageLpa, description, eligibilityCriteria, status, registrationDeadline, driveDate } = req.body;
  const result = await query(
    `INSERT INTO placement_drives (company_id, title, role, package_lpa, description, eligibility_criteria, status, registration_deadline, drive_date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [companyId, title, role, packageLpa, description, JSON.stringify(eligibilityCriteria || {}), status || 'upcoming', registrationDeadline, driveDate, req.user.id]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

exports.updateDrive = asyncHandler(async (req, res) => {
  const { title, role, packageLpa, description, status, registrationDeadline, driveDate } = req.body;
  const result = await query(
    `UPDATE placement_drives SET title=COALESCE($1,title), role=COALESCE($2,role),
     package_lpa=COALESCE($3,package_lpa), description=COALESCE($4,description),
     status=COALESCE($5,status), registration_deadline=COALESCE($6,registration_deadline),
     drive_date=COALESCE($7,drive_date) WHERE id=$8 RETURNING *`,
    [title, role, packageLpa, description, status, registrationDeadline, driveDate, req.params.id]
  );
  if (!result.rows[0]) throw new AppError('Drive not found', 404);
  res.json({ success: true, data: result.rows[0] });
});

exports.deleteDrive = asyncHandler(async (req, res) => {
  await query('DELETE FROM placement_drives WHERE id = $1', [req.params.id]);
  res.json({ success: true, message: 'Drive deleted' });
});

exports.getDriveApplicants = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT a.*, u.first_name, u.last_name, u.email, s.roll_number, s.department, s.cgpa
     FROM applications a
     JOIN students s ON s.id = a.student_id
     JOIN users u ON u.id = s.user_id
     WHERE a.drive_id = $1 ORDER BY a.applied_date DESC`,
    [req.params.id]
  );
  res.json({ success: true, data: result.rows });
});
