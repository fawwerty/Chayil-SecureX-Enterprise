const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../utils/db');
const { authenticate, authorize, auditLog } = require('../middleware/auth');
const { runTool, verifyAuthorization } = require('../services/toolEngine');
const { scanQueue } = require('../utils/queue');
const logger = require('../utils/logger');

const scanLimiter = rateLimit({
  windowMs: 60 * 60000, // 1 hour
  max: parseInt(process.env.SCAN_RATE_LIMIT_MAX) || 20,
  keyGenerator: req => req.user?.id || req.ip,
  message: { error: 'Scan rate limit exceeded. Max 20 scans per hour.' },
});

const TOOL_META = {
  nmap:         { name: 'Nmap',        category: 'network',  targetTypes: ['ip','cidr','hostname'], desc: 'Network & port scanner' },
  nikto:        { name: 'Nikto',       category: 'web',      targetTypes: ['url','hostname'],       desc: 'Web vulnerability scanner' },
  theharvester: { name: 'theHarvester',category: 'osint',    targetTypes: ['domain'],               desc: 'Email & domain recon' },
  amass:        { name: 'Amass',       category: 'osint',    targetTypes: ['domain'],               desc: 'Subdomain enumeration' },
  whatweb:      { name: 'WhatWeb',     category: 'web',      targetTypes: ['url','hostname'],       desc: 'Web tech fingerprinting' },
  nuclei:       { name: 'Nuclei',      category: 'vuln',     targetTypes: ['url','hostname'],       desc: 'Template-based vuln scanner' },
  wafw00f:      { name: 'WafW00f',     category: 'web',      targetTypes: ['url','hostname'],       desc: 'WAF detection' },
  sqlmap:       { name: 'SQLMap',      category: 'web',      targetTypes: ['url'],                  desc: 'SQL injection testing (controlled)' },
};

// GET /api/scans/tools - list available tools
router.get('/tools', authenticate, (req, res) => {
  res.json({ tools: TOOL_META });
});

// POST /api/scans - launch a scan
router.post('/', authenticate, authorize('admin','analyst'), scanLimiter, auditLog('scan_launched'), async (req, res) => {
  const schema = Joi.object({
    tool: Joi.string().valid(...Object.keys(TOOL_META)).required(),
    target: Joi.string().min(3).max(255).required(),
    target_type: Joi.string().valid('ip','domain','url','cidr','hostname').required(),
    options: Joi.object().optional(),
    force_authorize: Joi.boolean().optional(), // admin only
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { tool, target, target_type, options = {} } = value;

  // Validate target format
  const sanitizedTarget = target.trim().replace(/[;&|`$(){}[\]<>\\]/g, '');
  if (sanitizedTarget !== target.trim()) return res.status(400).json({ error: 'Invalid characters in target' });

  // Authorization check
  const { authorized } = await verifyAuthorization(req.user.org_id, sanitizedTarget);
  if (!authorized && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Target not in authorized assets list. Add asset first or request authorization.' });
  }

  // Sensitive Tools Check (Approval Required)
  const sensitiveTools = ['sqlmap', 'metasploit'];
  if (sensitiveTools.includes(tool)) {
    const approval = await query(`
      SELECT status FROM exploit_approvals 
      WHERE org_id = $1 AND tool = $2 AND target = $3 AND status = 'approved'
      ORDER BY created_at DESC LIMIT 1
    `, [req.user.org_id, tool, sanitizedTarget]);
    
    if (approval.rows.length === 0) {
       return res.status(403).json({ 
         error: `Exploitation tool '${tool}' requires Admin approval for target '${sanitizedTarget}'.`,
         requires_approval: true
       });
    }
  }

  const scanId = uuidv4();

  // Store scan in DB
  try {
    await query(`
      INSERT INTO scans (id, org_id, user_id, tool, target, target_type, status, options, authorized)
      VALUES ($1,$2,$3,$4,$5,$6,'queued',$7,$8)
    `, [scanId, req.user.org_id, req.user.id, tool, sanitizedTarget, target_type, JSON.stringify(options), authorized]);
  } catch { /* demo mode */ }

  // Broadcast queued status via WebSocket
  broadcastToOrg(req.user.org_id, { type: 'scan_queued', scanId, tool, target: sanitizedTarget });

  // Add to Job Queue
  try {
    await scanQueue.add('scan-jobs', { scanId, tool, target: sanitizedTarget, options, orgId: req.user.org_id, userId: req.user.id });
  } catch (err) {
    logger.error('Failed to enqueue job:', err);
    return res.status(500).json({ error: 'Failed to queue scan job' });
  }

  res.status(202).json({ scanId, tool, target: sanitizedTarget, status: 'queued', message: `${TOOL_META[tool].name} scan queued` });
});

async function runScanAsync({ scanId, tool, target, options, orgId, userId }) {
  try {
    await query(`UPDATE scans SET status='running', started_at=NOW() WHERE id=$1`, [scanId]).catch(() => {});
    broadcastToOrg(orgId, { type: 'scan_started', scanId, tool, target });

    const result = await runTool({ tool, target, options, orgId, userId });

    const findingsCount = result.parsed?.summary?.total_findings || result.parsed?.findings?.length || result.parsed?.summary?.total || 0;
    const riskScore = result.parsed?.summary?.risk_score || 0;

    await query(`
      UPDATE scans SET status='completed', completed_at=NOW(), result_raw=$1, result_json=$2, risk_score=$3, findings_count=$4
      WHERE id=$5
    `, [result.raw, JSON.stringify(result.parsed), riskScore, findingsCount, scanId]).catch(() => {});

    broadcastToOrg(orgId, { type: 'scan_completed', scanId, tool, target, findingsCount, riskScore, result: result.parsed });

    // Auto-create vulnerabilities from findings and map to compliance controls
    if (result.parsed?.findings && result.parsed.findings.length > 0) {
      for (const finding of result.parsed.findings.slice(0, 20)) {
        const severity = finding.severity || 'info';
        
        try {
           const vulnResult = await query(`
             INSERT INTO vulnerabilities (scan_id, org_id, title, severity, description, status)
             VALUES ($1,$2,$3,$4,$5,'open')
             RETURNING id
           `, [scanId, orgId, finding.text || finding.title || finding.detail || 'Finding', severity, JSON.stringify(finding)]);
           
           // Simple automated GRC mapping trigger
           if (['critical', 'high'].includes(severity.toLowerCase())) {
              await query(`
                 INSERT INTO compliance_controls (org_id, framework, control_id, title, description, status)
                 VALUES ($1, 'ISO 27001', 'A.8.8', 'Management of technical vulnerabilities', 'Unmitigated high-severity finding detected: ' || $2, 'non_compliant')
              `, [orgId, finding.text || finding.title || 'Technical Vulnerability']);
           }
        } catch (e) {
           logger.error('Failed to map vulnerability to GRC:', e);
        }
      }
    }
  } catch (err) {
    logger.error('Scan failed:', err);
    await query(`UPDATE scans SET status='failed', completed_at=NOW() WHERE id=$1`, [scanId]).catch(() => {});
    broadcastToOrg(orgId, { type: 'scan_failed', scanId, error: err.message });
  }
}

function broadcastToOrg(orgId, payload) {
  if (!global.wsClients) return;
  const msg = JSON.stringify(payload);
  global.wsClients.forEach((ws) => {
    try { ws.send(msg); } catch {}
  });
}

// GET /api/scans - list scans
router.get('/', authenticate, async (req, res) => {
  try {
    const r = await query(`
      SELECT s.*, u.name as user_name FROM scans s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.org_id = $1 ORDER BY s.created_at DESC LIMIT 50
    `, [req.user.org_id]);
    res.json({ scans: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
});

// GET /api/scans/vulnerabilities - Aggregate list of all findings
router.get('/vulnerabilities', authenticate, async (req, res) => {
  try {
    const r = await query(`
      SELECT * FROM vulnerabilities 
      WHERE org_id = $1 
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
          ELSE 5 
        END, created_at DESC
    `, [req.user.org_id]);
    res.json({ vulnerabilities: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vulnerabilities' });
  }
});


// GET /api/scans/:id - get single scan result
router.get('/:id', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT * FROM scans WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Scan not found' });
    res.json({ scan: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scan details' });
  }
});

// ── EXPLOIT APPROVALS ──────────────────────────────────────────────────────────
// Analyst requests approval
router.post('/approvals', authenticate, authorize('analyst', 'admin'), async (req, res) => {
  const { tool, target, reason } = req.body;
  try {
    const r = await query(`
      INSERT INTO exploit_approvals (org_id, requester_id, tool, target, reason)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [req.user.org_id, req.user.id, tool, target, reason]);
    res.json({ approval: r.rows[0], message: 'Approval request submitted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit approval' });
  }
});

// Admin views pending approvals
router.get('/approvals', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await query(`
      SELECT a.*, u.name as requester_name 
      FROM exploit_approvals a
      JOIN users u ON a.requester_id = u.id
      WHERE a.status = 'pending'
      ORDER BY a.created_at DESC
    `);
    res.json({ approvals: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
});

// Admin decides (approve/reject)
router.post('/approvals/:id/decide', authenticate, authorize('admin'), auditLog('exploit_decision'), async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  try {
    await query(`
      UPDATE exploit_approvals 
      SET status = $1, approver_id = $2, decision_at = NOW() 
      WHERE id = $3
    `, [status, req.user.id, req.params.id]);
    res.json({ success: true, message: `Request ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Decision failed' });
  }
});

// DELETE /api/scans/:id
router.delete('/:id', authenticate, authorize('admin','analyst'), async (req, res) => {
  try {
    await query('DELETE FROM scans WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
    res.json({ message: 'Scan deleted' });
  } catch { res.json({ message: 'Deleted (demo mode)' }); }
});

// GET /api/scans/:id/export
router.get('/:id/export', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT * FROM scans WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Scan not found' });
    const scan = r.rows[0];
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="scan-${req.params.id}.json"`);
    res.json({ exported_at: new Date().toISOString(), scan });
  } catch { res.status(500).json({ error: 'Export failed' }); }
});

module.exports = router;
