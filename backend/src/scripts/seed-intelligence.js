require('dotenv').config();
const { query } = require('../utils/db');

async function seed() {
  console.log('🚀 Seeding Operational Intelligence...');

  try {
    // 1. Get Org
    const orgRes = await query('SELECT id FROM organizations LIMIT 1');
    if (orgRes.rows.length === 0) {
      console.error('❌ No organization found. Please run baseline seeder first.');
      process.exit(1);
    }
    const orgId = orgRes.rows[0].id;

    // 2. Seed Risks
    console.log('--- Seeding Risks ---');
    const risks = [
      { title: 'Insecure Network Segmentation', impact: 4, likelihood: 3, domain: 'Network Security' },
      { title: 'Exposed Database Credentials', impact: 5, likelihood: 2, domain: 'Data Protection' },
      { title: 'Lack of MFA on Legacy API', impact: 4, likelihood: 4, domain: 'Identity & Access' },
      { title: 'Unpatched Web Server (CVE-2023-XYZ)', impact: 3, likelihood: 5, domain: 'Application Security' },
    ];

    for (const r of risks) {
      await query(
        `INSERT INTO risks (org_id, title, impact, likelihood, score, status) 
         VALUES ($1, $2, $3, $4, $5, 'active') 
         ON CONFLICT DO NOTHING`,
        [orgId, r.title, r.impact, r.likelihood, r.impact * r.likelihood * 4]
      );
    }

    // 3. Seed Audit Logs (for Threat Stream)
    console.log('--- Seeding Audit Logs ---');
    const logs = [
      { action: 'Brute force attack detected on VPN endpoint', resource: 'vpn.corp.local', status: 'critical' },
      { action: 'Suspicious outbound connection to C2 server', resource: 'ws-034.corp', status: 'critical' },
      { action: 'Unauthorized access attempt to HR DB', resource: 'db-hr-01', status: 'failed' },
      { action: 'Privilege escalation attempt on Root', resource: 'srv-prod-api', status: 'critical' },
    ];

    for (const l of logs) {
      await query(
        `INSERT INTO audit_logs (org_id, action, resource, status, created_at) 
         VALUES ($1, $2, $3, $4, NOW() - interval '1 minute' * floor(random()*60))`,
        [orgId, l.action, l.resource, l.status]
      );
    }

    // 4. Seed Compliance Controls
    console.log('--- Seeding Compliance ---');
    const frameworks = ['ISO 27001', 'NIST CSF'];
    for (const f of frameworks) {
      for (let i = 1; i <= 5; i++) {
        await query(
          `INSERT INTO compliance_controls (org_id, framework, control_id, title, status) 
           VALUES ($1, $2, $3, $4, $5)`,
          [orgId, f, `${f}-C0${i}`, `Control ${i} for ${f}`, i % 2 === 0 ? 'implemented' : 'not_implemented']
        );
      }
    }

    console.log('✅ Intelligence Seeding Complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    process.exit(0);
  }
}

seed();
