const { pool, query } = require('./src/utils/db');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    const hash = await bcrypt.hash('password123', 12);
    
    // Create Org if needed
    let orgResult = await query("SELECT id FROM organizations WHERE name='Chayil SecureX Corp'");
    if (orgResult.rows.length === 0) {
      orgResult = await query("INSERT INTO organizations (name) VALUES ('Chayil SecureX Corp') RETURNING id");
    }
    const orgId = orgResult.rows[0].id;

    // Create Admin
    const adminCheck = await query("SELECT id FROM users WHERE email='admin@chayil.com'");
    if (adminCheck.rows.length === 0) {
      await query("INSERT INTO users (name, email, password_hash, role, org_id, is_active) VALUES ('System Admin', 'admin@chayil.com', $1, 'admin', $2, true)", [hash, orgId]);
    } else {
      await query("UPDATE users SET password_hash=$1 WHERE email='admin@chayil.com'", [hash]);
    }

    // Create Analyst
    const analystCheck = await query("SELECT id FROM users WHERE email='analyst@chayil.com'");
    if (analystCheck.rows.length === 0) {
      await query("INSERT INTO users (name, email, password_hash, role, org_id, is_active) VALUES ('Senior Analyst', 'analyst@chayil.com', $1, 'analyst', $2, true)", [hash, orgId]);
    } else {
      await query("UPDATE users SET password_hash=$1 WHERE email='analyst@chayil.com'", [hash]);
    }

    console.log('Seed users created/reset successfully!');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
seed();
