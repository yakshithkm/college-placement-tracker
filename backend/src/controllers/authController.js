const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const { generateAccessToken, generateRefreshToken, validateRefreshToken, revokeRefreshToken, revokeAllUserTokens } = require('../utils/jwt');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

exports.register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, collegeId, role = 'student' } = req.body;

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const allowedRoles = ['student', 'coordinator'];
  const userRole = allowedRoles.includes(role) ? role : 'student';
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await transaction(async (client) => {
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, college_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, role, first_name, last_name`,
      [email, passwordHash, userRole, firstName, lastName, phone || null, collegeId || null]
    );
    const user = userResult.rows[0];

    if (userRole === 'student') {
      await client.query(
        'INSERT INTO students (user_id) VALUES ($1)',
        [user.id]
      );
    }

    return user;
  });

  const accessToken = generateAccessToken(result);
  const refreshToken = await generateRefreshToken(result.id);

  logger.info(`User registered: ${email} (${userRole})`);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: { id: result.id, email: result.email, role: result.role, firstName: result.first_name, lastName: result.last_name },
      accessToken,
      refreshToken,
    },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await query(
    'SELECT id, email, password_hash, role, first_name, last_name, is_active FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];
  if (!user || !user.is_active) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  let studentId = null;
  if (user.role === 'student') {
    const sResult = await query('SELECT id FROM students WHERE user_id = $1', [user.id]);
    studentId = sResult.rows[0]?.id;
  }

  logger.info(`User logged in: ${email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        studentId,
      },
      accessToken,
      refreshToken,
    },
  });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token required', 400);

  const tokenData = await validateRefreshToken(refreshToken);
  if (!tokenData) throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');

  await revokeRefreshToken(refreshToken);

  const user = { id: tokenData.user_id, email: tokenData.email, role: tokenData.role };
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user.id);

  res.json({
    success: true,
    data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
  });
});

exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await revokeRefreshToken(refreshToken);
  res.json({ success: true, message: 'Logged out successfully' });
});

exports.logoutAll = asyncHandler(async (req, res) => {
  await revokeAllUserTokens(req.user.id);
  res.json({ success: true, message: 'Logged out from all devices' });
});

exports.getMe = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.college_id, u.avatar_url, u.created_at,
            s.id as student_id, s.roll_number, s.department, s.batch_year, s.graduation_year,
            s.cgpa, s.bio, s.linkedin_url, s.github_url, s.portfolio_url, s.placement_eligible
     FROM users u
     LEFT JOIN students s ON s.user_id = u.id
     WHERE u.id = $1`,
    [req.user.id]
  );

  if (!result.rows[0]) throw new AppError('User not found', 404);

  const row = result.rows[0];
  res.json({
    success: true,
    data: {
      id: row.id,
      email: row.email,
      role: row.role,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      collegeId: row.college_id,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      student: row.student_id ? {
        id: row.student_id,
        rollNumber: row.roll_number,
        department: row.department,
        batchYear: row.batch_year,
        graduationYear: row.graduation_year,
        cgpa: row.cgpa,
        bio: row.bio,
        linkedinUrl: row.linkedin_url,
        githubUrl: row.github_url,
        portfolioUrl: row.portfolio_url,
        placementEligible: row.placement_eligible,
      } : null,
    },
  });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);
  const newHash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);
  await revokeAllUserTokens(req.user.id);
  res.json({ success: true, message: 'Password changed successfully' });
});
