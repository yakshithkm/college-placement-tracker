/**
 * Database migration runner
 * Usage: node src/utils/migrate.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'placement_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const migrationsDir = path.join(__dirname, '../../../database/migrations');
const seedsDir = path.join(__dirname, '../../../database/seeds');

async function runFiles(dir, label) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  console.log(`\nRunning ${files.length} ${label} file(s)...`);
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    try {
      await pool.query(sql);
      console.log(`  ✓ ${file}`);
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}`);
      throw err;
    }
  }
}

async function main() {
  const action = process.argv[2] || 'migrate';
  try {
    if (action === 'migrate' || action === 'all') {
      await runFiles(migrationsDir, 'migration');
    }
    if (action === 'seed' || action === 'all') {
      await runFiles(seedsDir, 'seed');
    }
    console.log('\n✅ Done.\n');
  } catch (err) {
    console.error('\n❌ Failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
