const express = require('express');
const { query } = require('../utils/db');
const { authenticate, authorize } = require('../middleware/auth');
// const { Parser: CSVParser } = require('json2csv');

// ── ASSETS ───────────────────────────────────────────────────────────────────
const assetsRouter = express.Router();
assetsRouter.get('/', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT * FROM assets WHERE org_id=$1 ORDER BY last_seen DESC', [req.user.org_id]);
    res.json({ assets: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

assetsRouter.post('/', authenticate, async (req, res) => {
  const { name, type, ip_address, hostname, os, criticality } = req.body;
  try {
    const r = await query(
      `INSERT INTO assets (org_id, name, type, ip_address, hostname, os, criticality, last_seen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [req.user.org_id, name, type, ip_address, hostname, os, criticality]
    );
    res.json({ asset: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// ── RISKS ────────────────────────────────────────────────────────────────────
const risksRouter = express.Router();
risksRouter.get('/', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT * FROM risks WHERE org_id=$1 ORDER BY score DESC', [req.user.org_id]);
    res.json({ risks: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch risks' });
  }
});

risksRouter.post('/', authenticate, async (req, res) => {
  const { title, description, impact, likelihood, owner, status } = req.body;
  const score = (impact || 1) * (likelihood || 1) * 4;
  try {
    const r = await query(
      `INSERT INTO risks (org_id, title, description, impact, likelihood, score, owner, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.org_id, title, description, impact, likelihood, score, owner, status || 'identified']
    );
    res.json({ risk: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log risk' });
  }
});

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
const dashboardRouter = express.Router();
dashboardRouter.get('/stats', authenticate, async (req, res) => {
  try {
    const [scansR, vulnsR, incidentsR, assetsR, recentIncidentsR, threatsR, risksR, complianceR] = await Promise.all([
      query('SELECT COUNT(*) FROM scans WHERE org_id=$1', [req.user.org_id]),
      query('SELECT severity, COUNT(*) FROM vulnerabilities WHERE org_id=$1 GROUP BY severity', [req.user.org_id]),
      query("SELECT COUNT(*) FROM incidents WHERE org_id=$1 AND status != 'closed'", [req.user.org_id]),
      query('SELECT COUNT(*) FROM assets WHERE org_id=$1', [req.user.org_id]),
      query('SELECT * FROM incidents WHERE org_id=$1 ORDER BY created_at DESC LIMIT 5', [req.user.org_id]),
      query(`SELECT id, action as msg, created_at as time, resource as host, status 
             FROM audit_logs WHERE org_id=$1 AND status IN ('failed', 'critical') 
             ORDER BY created_at DESC LIMIT 10`, [req.user.org_id]),
      query('SELECT title as domain, score FROM risks WHERE org_id=$1 ORDER BY score DESC LIMIT 6', [req.user.org_id]),
      query('SELECT status FROM compliance_controls WHERE org_id=$1', [req.user.org_id]),
    ]);

    const vulns = vulnsR.rows.reduce((acc, r) => { acc[r.severity.toLowerCase()] = parseInt(r.count); return acc; }, {});
    const complianceTotal = complianceR.rows.length;
    const complianceImplemented = complianceR.rows.filter(c => c.status === 'implemented').length;
    const complianceScore = complianceTotal > 0 ? Math.round((complianceImplemented / complianceTotal) * 100) : 0;

    res.json({
      stats: {
        scans: parseInt(scansR.rows[0]?.count || 0),
        open_incidents: parseInt(incidentsR.rows[0]?.count || 0),
        assets: parseInt(assetsR.rows[0]?.count || 0),
        vulnerabilities: vulns,
        critical_vulns: vulns.critical || 0,
        compliance_score: complianceScore,
      },
      recent_incidents: recentIncidentsR.rows,
      threat_stream: threatsR.rows.map(t => ({
        ...t,
        sev: t.status === 'critical' ? 'critical' : 'high',
        time: new Date(t.time).toLocaleString()
      })),
      risks: risksR.rows.map(r => ({
        domain: r.domain,
        score: parseInt(r.score),
        color: parseInt(r.score) > 75 ? '#ef4444' : '#6366f1'
      })),
    });
  } catch (err) {
    console.error('Dashboard aggregation error:', err);
    res.status(500).json({ error: 'Failed to aggregate dashboard intelligence' });
  }
});

dashboardRouter.get('/notifications', authenticate, async (req, res) => {
  try {
    const [approvalsR, incidentsR, auditR] = await Promise.all([
      query("SELECT COUNT(*) FROM exploit_approvals WHERE org_id=$1 AND status='pending'", [req.user.org_id]),
      query("SELECT id, title as msg, severity, created_at as time FROM incidents WHERE org_id=$1 AND status='open' ORDER BY created_at DESC LIMIT 5", [req.user.org_id]),
      query("SELECT id, action as msg, status as severity, created_at as time FROM audit_logs WHERE org_id=$1 AND status='critical' ORDER BY created_at DESC LIMIT 5", [req.user.org_id]),
    ]);

    const items = [
      ...incidentsR.rows.map(i => ({ ...i, type: 'incident', icon: '🔴' })),
      ...auditR.rows.map(a => ({ ...a, type: 'audit', icon: '⚠️' }))
    ];

    const pendingApprovals = parseInt(approvalsR.rows[0].count);
    if (pendingApprovals > 0) {
      items.unshift({ id: 'appr-req', msg: `${pendingApprovals} Pending Exploit Approvals`, severity: 'high', type: 'approval', icon: '🧨', time: new Date() });
    }

    res.json({
      count: items.length,
      notifications: items.sort((a,b) => new Date(b.time) - new Date(a.time))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ── INCIDENTS ────────────────────────────────────────────────────────────────
const incidentsRouter = express.Router();
incidentsRouter.get('/', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT * FROM incidents WHERE org_id=$1 ORDER BY created_at DESC', [req.user.org_id]);
    res.json({ incidents: r.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch incidents' }); }
});

// ── FEEDS & INTEL ────────────────────────────────────────────────────────────
const feedsRouter = express.Router();
const intelRouter = express.Router();

intelRouter.get('/feed', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT * FROM threat_iocs ORDER BY created_at DESC LIMIT 50');
    res.json({ iocs: r.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch intelligence feed' }); }
});

feedsRouter.get('/', authenticate, async (req, res) => {
  res.json({ status: 'Operational', source: 'Chayil Global Intel' });
});

// ── TEAMS ────────────────────────────────────────────────────────────────────
const teamsRouter = express.Router();
teamsRouter.get('/', authenticate, async (req, res) => {
  try {
    const r = await query("SELECT id, name, role, email FROM users WHERE org_id=$1 AND role IN ('admin', 'analyst')", [req.user.org_id]);
    res.json({ members: r.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch team members' }); }
});

// ── REPORTS ────────────────────────────────────────────────────────────────────
const reportsRouter = express.Router();
reportsRouter.get('/', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT * FROM reports WHERE org_id=$1 ORDER BY created_at DESC', [req.user.org_id]);
    res.json({ reports: r.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch reports' }); }
});

// ── AUDITS ─────────────────────────────────────────────────────────────────────
const auditsRouter = express.Router();
auditsRouter.get('/', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT * FROM audits WHERE org_id=$1 ORDER BY scheduled_at DESC', [req.user.org_id]);
    res.json({ audits: r.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch audits' }); }
});

auditsRouter.get('/findings', authenticate, async (req, res) => {
  try {
    const r = await query(
      `SELECT v.*, a.title as audit_name FROM vulnerabilities v 
       LEFT JOIN audits a ON v.org_id = a.org_id 
       WHERE v.org_id=$1 ORDER BY v.created_at DESC`, [req.user.org_id]
    );
    res.json({ findings: r.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch findings' }); }
});

// ── ASSURANCE ──────────────────────────────────────────────────────────────────
const assuranceRouter = express.Router();
assuranceRouter.get('/', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT * FROM assurance_measures WHERE org_id=$1 ORDER BY category', [req.user.org_id]);
    res.json({ measures: r.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch assurance measures' }); }
});

// ── ANALYTICS & CYBERSCORE ───────────────────────────────────────────────────
const analyticsRouter = express.Router();
analyticsRouter.get('/cyberscore', authenticate, async (req, res) => {
  try {
    const [counts, risksR, complianceR] = await Promise.all([
      query('SELECT type, COUNT(*) FROM assets WHERE org_id=$1 GROUP BY type', [req.user.org_id]),
      query('SELECT title, score, status FROM risks WHERE org_id=$1', [req.user.org_id]),
      query('SELECT status FROM compliance_controls WHERE org_id=$1', [req.user.org_id]),
    ]);

    const domains = [
      { name: 'Network Security', weight: 20, base: 0 },
      { name: 'Application Security', weight: 15, base: 0 },
      { name: 'Data Protection', weight: 20, base: 0 },
      { name: 'Identity & Access', weight: 20, base: 0 },
      { name: 'Cloud Security', weight: 15, base: 0 },
      { name: 'Compliance', weight: 10, base: 0 },
    ].map(d => {
      const relatedRisks = risksR.rows.filter(r => 
        (r.domain && r.domain.includes(d.name)) || 
        (r.title && r.title.includes(d.name))
      );
      const penalty = relatedRisks.filter(r => parseInt(r.score) > 15).length * 8;
      // When base is 0, score is mostly 0 until controls are added. For true zero-state:
      return { ...d, score: Math.max(0, d.base - penalty) };
    });

    const overall = domains.length > 0 
      ? Math.round(domains.reduce((acc, d) => acc + (d.score * (d.weight/100)), 0))
      : 0;

    res.json({ overall, domains });
  } catch (err) {
    console.error('CyberScore Analytics Error:', err);
    res.status(500).json({ error: 'Failed to calculate CyberScore intelligence' });
  }
});

// ── CISO ADVISORY ───────────────────────────────────────────────────────────
const advisoryRouter = express.Router();
advisoryRouter.get('/', authenticate, async (req, res) => {
  try {
    const [complianceR, auditsR, risksR] = await Promise.all([
      query('SELECT status FROM compliance_controls WHERE org_id=$1', [req.user.org_id]),
      query("SELECT * FROM audits WHERE org_id=$1 AND status='scheduled' ORDER BY scheduled_at LIMIT 5", [req.user.org_id]),
      query('SELECT * FROM risks WHERE org_id=$1 AND score > 20 LIMIT 5', [req.user.org_id]),
    ]);

    const maturityLevels = [
      { name: 'Asset Management', level: 0, max: 5, color: '#6366f1' },
      { name: 'Vulnerability Mgmt', level: 0, max: 5, color: '#f59e0b' },
      { name: 'Incident Response', level: 0, max: 5, color: '#10b981' },
      { name: 'Cloud Integrity', level: 0, max: 5, color: '#8b5cf6' },
    ];

    const roadmap = [
      ...auditsR.rows.map(a => ({ id: `AUD-${a.id}`, title: `Security Audit: ${a.title}`, impact: 'High', effort: 'Medium', timeline: new Date(a.scheduled_at).toLocaleDateString(), status: 'Scheduled' })),
      ...risksR.rows.map(r => ({ id: `RSK-${r.id}`, title: `Remediate: ${r.title}`, impact: 'Critical', effort: 'High', timeline: 'Q3 2024', status: 'In Progress' })),
    ];

    res.json({ maturity: maturityLevels, roadmap });
  } catch (err) { res.status(500).json({ error: 'Advisory fetch failed' }); }
});

// ── COMPLIANCE ────────────────────────────────────────────────────────────────
const complianceRouter = express.Router();
complianceRouter.get('/', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT * FROM compliance_controls WHERE org_id=$1 ORDER BY framework, control_id', [req.user.org_id]);
    res.json({ controls: r.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch compliance controls' }); }
});

// ── AUDIT LOGS ────────────────────────────────────────────────────────────────
const auditRouter = express.Router();
auditRouter.get('/', authenticate, async (req, res) => {
  try {
    const { action, status, limit = 50 } = req.query;
    let sql = 'SELECT * FROM audit_logs WHERE org_id=$1';
    const params = [req.user.org_id];
    if (action) { sql += ` AND action=$${params.length+1}`; params.push(action); }
    if (status) { sql += ` AND status=$${params.length+1}`; params.push(status); }
    sql += ` ORDER BY created_at DESC LIMIT $${params.length+1}`;
    params.push(limit);
    const r = await query(sql, params);
    res.json({ logs: r.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch system audit logs' }); }
});

module.exports = {
  assetsRouter,
  risksRouter,
  dashboardRouter,
  reportsRouter,
  auditsRouter,
  assuranceRouter,
  analyticsRouter,
  advisoryRouter,
  incidentsRouter,
  feedsRouter,
  intelRouter,
  teamsRouter,
  complianceRouter,
  auditRouter
};
