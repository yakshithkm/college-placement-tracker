/**
 * Placeholder seed generator — creates realistic test data for multiple students
 * Usage: node scripts/generate-test-data.js
 */
require('dotenv').config({ path: '../backend/.env.development' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'placement_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_secure_password',
});

const DEPARTMENTS = ['CSE', 'ECE', 'Mechanical', 'Civil', 'IT', 'EEE'];
const SKILLS = [
  ['JavaScript', 'Programming'], ['Python', 'Programming'], ['Java', 'Programming'],
  ['React.js', 'Frontend'], ['Vue.js', 'Frontend'], ['Angular', 'Frontend'],
  ['Node.js', 'Backend'], ['Express.js', 'Backend'], ['Django', 'Backend'],
  ['PostgreSQL', 'Database'], ['MySQL', 'Database'], ['MongoDB', 'Database'],
  ['Docker', 'DevOps'], ['Kubernetes', 'DevOps'], ['Git', 'Tools'],
  ['AWS', 'DevOps'], ['Linux', 'Tools'], ['Figma', 'Tools'],
];
const CERTS = [
  ['AWS Cloud Practitioner', 'Amazon Web Services'],
  ['React Developer', 'Meta'],
  ['Python for Data Science', 'IBM'],
  ['Google Cloud Associate', 'Google'],
  ['Docker Certified Associate', 'Docker Inc.'],
  ['Microsoft Azure Fundamentals', 'Microsoft'],
];
const COMPANIES_DATA = [
  'TCS', 'Infosys', 'Wipro', 'Cognizant', 'HCL', 'Tech Mahindra', 'Accenture'
];
const ROLES = ['Software Engineer', 'SDE-1', 'Associate Developer', 'Systems Engineer', 'Programmer Analyst'];

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function pickN(arr, n) { return arr.sort(() => Math.random() - 0.5).slice(0, n); }

async function generateStudent(client, index) {
  const id = uuidv4();
  const studentId = uuidv4();
  const dept = pick(DEPARTMENTS);
  const batchYear = randInt(2020, 2022);
  const cgpa = parseFloat(rand(6.0, 9.8).toFixed(2));
  const hash = await bcrypt.hash('Demo@1234', 12);

  await client.query(
    `INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, college_id, email_verified)
     VALUES ($1, $2, $3, 'student', $4, $5, $6, $7, true)`,
    [id, `student${index}@demo.edu`, hash, `Student${index}`, `Demo`, `98765${String(index).padStart(5,'0')}`, `${dept}${batchYear}${String(index).padStart(3,'0')}`]
  );

  await client.query(
    `INSERT INTO students (id, user_id, roll_number, department, batch_year, graduation_year, cgpa, tenth_percentage, twelfth_percentage, placement_eligible)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [studentId, id, `${dept}${batchYear}${index}`, dept, batchYear, batchYear + 4, cgpa,
     parseFloat(rand(70, 98).toFixed(1)), parseFloat(rand(68, 95).toFixed(1)), cgpa >= 6.5]
  );

  // Skills
  const mySkills = pickN(SKILLS, randInt(3, 8));
  for (const [name, cat] of mySkills) {
    await client.query(
      `INSERT INTO student_skills (student_id, skill_name, proficiency_level, category) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
      [studentId, name, randInt(2, 5), cat]
    );
  }

  // Projects
  const projectCount = randInt(1, 4);
  for (let p = 0; p < projectCount; p++) {
    const techs = pickN(mySkills.map(s => s[0]), Math.min(3, mySkills.length));
    await client.query(
      `INSERT INTO projects (student_id, title, description, technologies, is_featured)
       VALUES ($1,$2,$3,$4,$5)`,
      [studentId, `Project ${p + 1} by Student ${index}`, `A ${pick(['web', 'mobile', 'desktop', 'ML'])} project using ${techs.join(', ')}.`, techs, p === 0]
    );
  }

  // Certifications
  const certCount = randInt(0, 3);
  for (let c = 0; c < certCount; c++) {
    const [name, provider] = pick(CERTS);
    const yr = randInt(2022, 2024);
    await client.query(
      `INSERT INTO certifications (student_id, name, provider, issue_date) VALUES ($1,$2,$3,$4)`,
      [studentId, name, provider, `${yr}-${String(randInt(1,12)).padStart(2,'0')}-01`]
    );
  }

  // Aptitude scores
  const aptCount = randInt(1, 5);
  for (let a = 0; a < aptCount; a++) {
    const q = parseFloat(rand(40, 95).toFixed(1));
    const l = parseFloat(rand(40, 95).toFixed(1));
    const v = parseFloat(rand(40, 95).toFixed(1));
    await client.query(
      `INSERT INTO aptitude_scores (student_id, test_name, test_date, quantitative, logical, verbal, total_score, max_score, percentile)
       VALUES ($1,$2,$3,$4,$5,$6,$7,300,$8)`,
      [studentId, `Mock Test ${a + 1}`, `2024-${String(randInt(1,12)).padStart(2,'0')}-${String(randInt(1,28)).padStart(2,'0')}`,
       q, l, v, parseFloat(((q + l + v) / 3 * 3).toFixed(1)), parseFloat(rand(30, 98).toFixed(1))]
    );
  }

  // Interview scores
  const iCount = randInt(0, 3);
  for (let i = 0; i < iCount; i++) {
    const comm = randInt(5, 10), tech = randInt(4, 10), hr = randInt(5, 10), ps = randInt(4, 10);
    await client.query(
      `INSERT INTO interview_scores (student_id, interview_type, interview_date, communication_rating, technical_rating, hr_rating, problem_solving_rating, overall_rating)
       VALUES ($1,'mock',$2,$3,$4,$5,$6,$7)`,
      [studentId, `2024-${String(randInt(9,12)).padStart(2,'0')}-15`, comm, tech, hr, ps, parseFloat(((comm+tech+hr+ps)/4).toFixed(2))]
    );
  }

  // Applications
  const appCount = randInt(1, 5);
  const statuses = ['applied', 'test_cleared', 'interview_scheduled', 'selected', 'rejected'];
  for (let a = 0; a < appCount; a++) {
    await client.query(
      `INSERT INTO applications (student_id, company_name, role, applied_date, status)
       VALUES ($1,$2,$3,$4,$5)`,
      [studentId, pick(COMPANIES_DATA), pick(ROLES), `2024-${String(randInt(9,12)).padStart(2,'0')}-${String(randInt(1,28)).padStart(2,'0')}`, pick(statuses)]
    );
  }

  return studentId;
}

async function main() {
  const count = parseInt(process.argv[2]) || 20;
  console.log(`Generating ${count} demo students...`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 1; i <= count; i++) {
      await generateStudent(client, i);
      if (i % 5 === 0) console.log(`  Generated ${i}/${count}...`);
    }
    await client.query('COMMIT');
    console.log(`\n✅ Done — ${count} students created (password: Demo@1234)`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
