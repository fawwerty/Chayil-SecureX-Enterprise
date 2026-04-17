require('dotenv').config();
const { pool } = require('../utils/db');

async function cleanMockData() {
  console.log('Connecting to database to clean mock data...');
  let client;
  try {
    client = await pool.connect();
    
    // Ordered to respect foreign keys
    const tables = [
      'documents',
      'invoices',
      'engagements',
      'services',
      'consultations',
      'messages',
      'conversations',
      'tracking_logs',
      'compliance_mapping',
      'compliance_controls',
      'risks',
      'vulnerabilities',
      'scans',
      'exploit_approvals',
      'scan_pipelines',
      'reports',
      'osint_results',
      'incidents',
      'threat_iocs',
      'audit_logs',
      'assets',
      'contact_inquiries',
      'audits',
      'assurance_measures'
    ];

    for (const table of tables) {
      await client.query(`DELETE FROM ${table}`);
      console.log(`Cleared ${table}`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All operational mock data successfully cleared.');
    console.log('   (Users and Organizations were preserved so you can stay logged in)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    console.error('Error cleaning data:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

cleanMockData();
