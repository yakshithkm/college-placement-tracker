const { query } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const calculateReadinessScore = async (studentId) => {
  const [student, projects, certs, aptitude, interviews, applications, skills, quizStats] = await Promise.all([
    query('SELECT cgpa, tenth_percentage, twelfth_percentage, backlogs FROM students WHERE id = $1', [studentId]),
    query('SELECT COUNT(*) as count FROM projects WHERE student_id = $1', [studentId]),
    query('SELECT COUNT(*) as count FROM certifications WHERE student_id = $1', [studentId]),
    query('SELECT AVG(total_score/NULLIF(max_score,0)*100) as avg_pct, COUNT(*) as count FROM aptitude_scores WHERE student_id = $1', [studentId]),
    query('SELECT AVG(overall_rating) as avg_rating, COUNT(*) as count FROM interview_scores WHERE student_id = $1', [studentId]),
    query("SELECT COUNT(*) as count FROM applications WHERE student_id = $1 AND status != 'rejected'", [studentId]),
    query('SELECT COUNT(*) as count FROM student_skills WHERE student_id = $1', [studentId]),
    // Aptitude Test Module — quiz attempts (counts toward the same Aptitude Score bucket)
    query("SELECT AVG(percentage) as avg_pct, COUNT(*) as count FROM aptitude_attempts WHERE student_id = $1 AND status='submitted'", [studentId]),
  ]);

  const s = student.rows[0];
  if (!s) return null;

  // Academic score (used as a sub-factor of Projects/overall profile strength, see weighting below)
  const cgpaScore = Math.min((parseFloat(s.cgpa || 0) / 10) * 100, 100);
  const backlogPenalty = Math.min((s.backlogs || 0) * 10, 30);
  const academicScore = Math.max(cgpaScore - backlogPenalty, 0);

  // Projects score
  const projectCount = parseInt(projects.rows[0].count);
  const projectScore = Math.min(projectCount * 25, 100);

  // Certifications score
  const certCount = parseInt(certs.rows[0].count);
  const certScore = Math.min(certCount * 20, 100);

  // ── Aptitude score — blends legacy manual entries with the new Aptitude Test Module ──
  const manualAptPct = parseFloat(aptitude.rows[0].avg_pct || 0);
  const manualAptCount = parseInt(aptitude.rows[0].count);
  const quizAptPct = parseFloat(quizStats.rows[0].avg_pct || 0);
  const quizAptCount = parseInt(quizStats.rows[0].count);

  const totalAptCount = manualAptCount + quizAptCount;
  const aptitudeScore = totalAptCount > 0
    ? Math.round(((manualAptPct * manualAptCount) + (quizAptPct * quizAptCount)) / totalAptCount * 10) / 10
    : 0;

  // Interview readiness
  const interviewAvg = parseFloat(interviews.rows[0].avg_rating || 0);
  const interviewCount = parseInt(interviews.rows[0].count);
  const interviewScore = interviewCount > 0 ? (interviewAvg / 10) * 100 : 0;

  // Skills score (folded into projects/profile strength below; kept for strengths/weaknesses display)
  const skillCount = parseInt(skills.rows[0].count);
  const skillsScore = Math.min(skillCount * 10, 100);

  // Resume score
  const resumeResult = await query('SELECT score FROM resumes WHERE student_id = $1 AND is_active = true LIMIT 1', [studentId]);
  const resumeScore = parseFloat(resumeResult.rows[0]?.score) || 0;

  // ── Placement Readiness Score — spec-mandated weighting ──────────────────────
  // Resume 30% · Aptitude 30% · Projects 15% · Certifications 10% · Interview Readiness 15%
  const placementReadinessScore = (
    resumeScore * 0.30 +
    aptitudeScore * 0.30 +
    projectScore * 0.15 +
    certScore * 0.10 +
    interviewScore * 0.15
  );

  // Determine strengths and weaknesses
  const areas = [
    { name: 'Resume', score: resumeScore },
    { name: 'Aptitude Tests', score: aptitudeScore },
    { name: 'Projects', score: projectScore },
    { name: 'Certifications', score: certScore },
    { name: 'Interview Skills', score: interviewScore },
    { name: 'Academic Performance', score: academicScore },
    { name: 'Technical Skills', score: skillsScore },
  ].sort((a, b) => b.score - a.score);

  const strengthAreas = areas.filter(a => a.score >= 70).map(a => a.name);
  const weakAreas = areas.filter(a => a.score < 50).map(a => a.name);

  const recommendations = [];
  if (resumeScore < 50) recommendations.push({ type: 'resume', message: 'Upload and mark an active resume to boost your readiness score' });
  if (projectCount < 3) recommendations.push({ type: 'projects', message: 'Add more projects to strengthen your portfolio (aim for 3+)' });
  if (certCount < 2) recommendations.push({ type: 'certifications', message: 'Obtain industry certifications to validate your skills' });
  if (totalAptCount < 3) recommendations.push({ type: 'aptitude', message: 'Attempt more aptitude tests in the Aptitude Test Module to improve your scores' });
  if (interviewCount < 2) recommendations.push({ type: 'interviews', message: 'Schedule mock interviews to build confidence' });
  if (parseFloat(s.cgpa || 0) < 7) recommendations.push({ type: 'academic', message: 'Focus on improving your CGPA for better eligibility' });

  const snapshot = {
    placementReadinessScore: Math.round(placementReadinessScore * 10) / 10,
    resumeScore: Math.round(resumeScore * 10) / 10,
    aptitudeScore: Math.round(aptitudeScore * 10) / 10,
    interviewReadinessScore: Math.round(interviewScore * 10) / 10,
    skillsScore: Math.round(skillsScore * 10) / 10,
    certificationsScore: Math.round(certScore * 10) / 10,
    projectsScore: Math.round(projectScore * 10) / 10,
    academicScore: Math.round(academicScore * 10) / 10,
    quizAttemptCount: quizAptCount,
    quizAvgScore: Math.round(quizAptPct * 10) / 10,
    strengthAreas,
    weakAreas,
    recommendations,
  };

  // Save snapshot
  await query(
    `INSERT INTO analytics_snapshots 
      (student_id, placement_readiness_score, resume_score, aptitude_score, interview_readiness_score,
       skills_score, certifications_score, projects_score, strength_areas, weak_areas, recommendations)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [studentId, snapshot.placementReadinessScore, snapshot.resumeScore, snapshot.aptitudeScore,
     snapshot.interviewReadinessScore, snapshot.skillsScore, snapshot.certificationsScore,
     snapshot.projectsScore, snapshot.strengthAreas, snapshot.weakAreas, JSON.stringify(snapshot.recommendations)]
  );

  return snapshot;
};

exports.getMyAnalytics = asyncHandler(async (req, res) => {
  const studentResult = await query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
  if (!studentResult.rows[0]) throw new AppError('Student not found', 404);
  const studentId = studentResult.rows[0].id;

  const analytics = await calculateReadinessScore(studentId);
  
  // Get trend data
  const trends = await query(
    `SELECT placement_readiness_score, aptitude_score, interview_readiness_score, calculated_at
     FROM analytics_snapshots WHERE student_id = $1
     ORDER BY calculated_at DESC LIMIT 10`,
    [studentId]
  );

  res.json({
    success: true,
    data: {
      current: analytics,
      trends: trends.rows.reverse(),
    },
  });
});

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const studentResult = await query('SELECT id, cgpa, placement_eligible FROM students WHERE user_id = $1', [req.user.id]);
  if (!studentResult.rows[0]) throw new AppError('Student not found', 404);
  const { id: studentId } = studentResult.rows[0];

  const [projects, certs, applications, aptitude, interviews, latestSnapshot, quizStats] = await Promise.all([
    query('SELECT COUNT(*) as count, COUNT(*) FILTER (WHERE is_featured) as featured FROM projects WHERE student_id = $1', [studentId]),
    query('SELECT COUNT(*) as count FROM certifications WHERE student_id = $1', [studentId]),
    query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'selected') as selected FROM applications WHERE student_id = $1`, [studentId]),
    query('SELECT AVG(total_score/NULLIF(max_score,0)*100) as avg_pct FROM aptitude_scores WHERE student_id = $1', [studentId]),
    query('SELECT AVG(overall_rating) as avg_rating FROM interview_scores WHERE student_id = $1', [studentId]),
    query('SELECT * FROM analytics_snapshots WHERE student_id = $1 ORDER BY calculated_at DESC LIMIT 1', [studentId]),
    query("SELECT COUNT(*) as count, AVG(percentage) as avg_pct, MAX(percentage) as best_pct FROM aptitude_attempts WHERE student_id = $1 AND status='submitted'", [studentId]),
  ]);

  const snapshot = latestSnapshot.rows[0];

  res.json({
    success: true,
    data: {
      readinessScore: snapshot?.placement_readiness_score || 0,
      resumeScore: snapshot?.resume_score || 0,
      aptitudeAvg: Math.round(parseFloat(aptitude.rows[0].avg_pct || 0) * 10) / 10,
      interviewScore: Math.round(parseFloat(interviews.rows[0].avg_rating || 0) * 10) / 10,
      certCount: parseInt(certs.rows[0].count),
      projectCount: parseInt(projects.rows[0].count),
      applicationCount: parseInt(applications.rows[0].total),
      selectedCount: parseInt(applications.rows[0].selected),
      quizAttemptCount: parseInt(quizStats.rows[0].count),
      quizAvgScore: Math.round(parseFloat(quizStats.rows[0].avg_pct || 0) * 10) / 10,
      quizBestScore: Math.round(parseFloat(quizStats.rows[0].best_pct || 0) * 10) / 10,
    },
  });
});

exports.getCoordinatorStats = asyncHandler(async (req, res) => {
  const [totalStudents, eligible, applied, selected, avgReadiness, depts] = await Promise.all([
    query('SELECT COUNT(*) as count FROM students'),
    query('SELECT COUNT(*) as count FROM students WHERE placement_eligible = true'),
    query("SELECT COUNT(DISTINCT student_id) as count FROM applications"),
    query("SELECT COUNT(DISTINCT student_id) as count FROM applications WHERE status = 'selected'"),
    query('SELECT AVG(placement_readiness_score) as avg FROM analytics_snapshots WHERE calculated_at > NOW() - INTERVAL \'30 days\''),
    query('SELECT department, COUNT(*) as count, AVG(cgpa) as avg_cgpa FROM students GROUP BY department ORDER BY count DESC'),
  ]);

  const driveStats = await query(
    `SELECT pd.title, c.name as company, pd.status, pd.package_lpa,
            COUNT(a.id) as applicants
     FROM placement_drives pd
     LEFT JOIN companies c ON c.id = pd.company_id
     LEFT JOIN applications a ON a.drive_id = pd.id
     GROUP BY pd.id, c.name
     ORDER BY pd.created_at DESC LIMIT 10`
  );

  res.json({
    success: true,
    data: {
      totalStudents: parseInt(totalStudents.rows[0].count),
      eligibleStudents: parseInt(eligible.rows[0].count),
      studentsApplied: parseInt(applied.rows[0].count),
      studentsSelected: parseInt(selected.rows[0].count),
      avgReadinessScore: Math.round(parseFloat(avgReadiness.rows[0].avg || 0) * 10) / 10,
      departments: depts.rows,
      recentDrives: driveStats.rows,
    },
  });
});

exports.refreshAnalytics = asyncHandler(async (req, res) => {
  const studentResult = await query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
  if (!studentResult.rows[0]) throw new AppError('Student not found', 404);
  const analytics = await calculateReadinessScore(studentResult.rows[0].id);
  res.json({ success: true, data: analytics });
});

module.exports.calculateReadinessScore = calculateReadinessScore;