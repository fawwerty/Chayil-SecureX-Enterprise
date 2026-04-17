require('dotenv').config();
const { pool } = require('../utils/db');

async function updateUsersSchema() {
  console.log('Migrating users table for Advanced Enterprise IAM...');
  let client;
  try {
    client = await pool.connect();
    
    // Add advanced access control columns
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS mac_clearance VARCHAR(50) DEFAULT 'unclassified',
      ADD COLUMN IF NOT EXISTS access_rules JSONB DEFAULT '{"domains": [], "ip_whitelist": [], "time_restricted": false}'::jsonb;
    `);

    // Ensure status column exists
    await client.query(`
       ALTER TABLE users
       ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
    `);

    console.log('✅ Users schema updated successfully with IAM columns.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

updateUsersSchema();
