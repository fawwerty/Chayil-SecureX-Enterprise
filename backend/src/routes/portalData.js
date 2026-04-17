const express = require('express');
const router = express.Router();
const { query } = require('../utils/db');
const { authenticate, authorize, auditLog } = require('../middleware/auth');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const axios = require('axios');
const crypto = require('crypto');

// ── CONSULTATIONS ─────────────────────────────────────────────────────────────

// Request a consultation (Client)
router.post('/consultations', authenticate, async (req, res) => {
  const { subject, message } = req.body;
  try {
    const r = await query(
      `INSERT INTO consultations (org_id, user_id, subject, message) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.org_id, req.user.id, subject, message]
    );

    // Email to Admin
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Chayil SecureX" <${process.env.SMTP_USER}>`,
      to: process.env.SITE_EMAIL,
      subject: `New Consultation Request: ${subject}`,
      text: `Client: ${req.user.name}\nOrg ID: ${req.user.org_id}\n\nMessage:\n${message}`,
    });

    res.json({ message: 'Consultation request submitted successfully', consultation: r.rows[0] });
  } catch (err) {
    logger.error('Consultation Error:', err);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// Get consultations (Admin)
router.get('/consultations', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await query(
      `SELECT c.*, u.name as user_name, o.name as org_name FROM consultations c 
       JOIN users u ON c.user_id = u.id 
       JOIN organizations o ON c.org_id = o.id 
       ORDER BY c.created_at DESC`
    );
    res.json({ consultations: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// ── ENGAGEMENTS ───────────────────────────────────────────────────────────────

// Fetch engagements (Role-based)
router.get('/engagements', authenticate, async (req, res) => {
  try {
    let sql = `SELECT e.*, s.name as service_name FROM engagements e 
               JOIN services s ON e.service_id = s.id 
               WHERE e.org_id = $1 ORDER BY e.created_at DESC`;
    let params = [req.user.org_id];

    if (req.user.role === 'admin') {
      sql = `SELECT e.*, s.name as service_name, o.name as org_name FROM engagements e 
             JOIN services s ON e.service_id = s.id 
             JOIN organizations o ON e.org_id = o.id 
             ORDER BY e.created_at DESC`;
      params = [];
    } else if (req.user.role === 'analyst') {
      sql = `SELECT e.*, s.name as service_name, o.name as org_name FROM engagements e 
             JOIN services s ON e.service_id = s.id 
             JOIN organizations o ON e.org_id = o.id 
             WHERE e.assigned_analyst = $1 ORDER BY e.created_at DESC`;
      params = [req.user.id];
    }

    const r = await query(sql, params);
    res.json({ engagements: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch engagements' });
  }
});

// Request new engagement (Client)
router.post('/engagements', authenticate, async (req, res) => {
  const { service_id, title } = req.body;
  try {
    const r = await query(
      `INSERT INTO engagements (org_id, service_id, title, status) VALUES ($1, $2, $3, 'requested') RETURNING *`,
      [req.user.org_id, service_id, title]
    );
    res.json({ engagement: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create engagement' });
  }
});

// ── PAYSTACK ──────────────────────────────────────────────────────────────────

// Initialize Payment
router.post('/payments/initialize', authenticate, async (req, res) => {
  const { amount, email, invoice_id } = req.body;
  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email,
      amount: amount * 100, // Paystack uses Kobo/Cents
      metadata: { invoice_id },
    }, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    res.json(response.data);
  } catch (err) {
    logger.error('Paystack Init Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// Webhook for verification
router.post('/payments/webhook', async (req, res) => {
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
  if (hash !== req.headers['x-paystack-signature']) return res.sendStatus(400);

  const event = req.body;
  if (event.event === 'charge.success') {
    const { invoice_id } = event.data.metadata;
    const ref = event.data.reference;
    try {
      await query(
        `UPDATE invoices SET status='paid', paystack_ref=$1, paid_at=NOW() WHERE id=$2`,
        [ref, invoice_id]
      );
      logger.info(`Payment successful for invoice ${invoice_id}`);
    } catch (err) {
      logger.error('Webhook DB Error:', err);
    }
  }
  res.sendStatus(200);
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── UPLOAD CONFIG ─────────────────────────────────────────────────────────────
const uploadDir = 'uploads/documents';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString('hex');
    cb(null, `${unique}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ 
  storage, 
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// ── DOCUMENTS ─────────────────────────────────────────────────────────────────

// Upload Document
router.post('/documents', authenticate, upload.single('file'), auditLog('document_upload'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { title, engagement_id, category } = req.body;
  
  try {
    const r = await query(
      `INSERT INTO documents (org_id, engagement_id, title, file_path, file_type, category, uploaded_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.org_id, engagement_id || null, title || req.file.originalname, req.file.path, req.file.mimetype, category || 'evidence', req.user.id]
    );
    res.json({ document: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save document metadata' });
  }
});

// List Documents
router.get('/documents', authenticate, async (req, res) => {
  try {
    let sql = `SELECT d.*, u.name as uploader_name FROM documents d 
               JOIN users u ON d.uploaded_by = u.id 
               WHERE d.org_id = $1 ORDER BY d.created_at DESC`;
    let params = [req.user.org_id];

    if (req.user.role === 'admin') {
      sql = `SELECT d.*, u.name as uploader_name, o.name as org_name FROM documents d 
             JOIN users u ON d.uploaded_by = u.id 
             JOIN organizations o ON d.org_id = o.id 
             ORDER BY d.created_at DESC`;
      params = [];
    }

    const r = await query(sql, params);
    res.json({ documents: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Download Document
router.get('/documents/:id/download', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    
    const doc = r.rows[0];
    // Check permission: Admin, or User from same org
    if (req.user.role !== 'admin' && doc.org_id !== req.user.org_id) {
       return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(doc.file_path)) return res.status(404).json({ error: 'File missing on server' });
    
    res.download(doc.file_path, doc.title);
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

// ── ANALYTICS & PORTAL INSIGHTS ────────────────────────────────────────────────
/**
 * attack-surface: Aggregated data for discovery map
 */
router.get('/attack-surface', authenticate, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    // Get latest ports from all completed scans
    const r = await query(`
      SELECT DISTINCT ON (port, service) port, service, protocol, status 
      FROM vulnerabilities 
      WHERE org_id = $1 AND port IS NOT NULL
      ORDER BY port, service, created_at DESC
    `, [orgId]);

    // Count distinct assets
    const a = await query('SELECT count(*) as total FROM assets WHERE org_id = $1', [orgId]);
    
    res.json({
      ports: r.rows,
      totalAssets: parseInt(a.rows[0].total) || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to aggregate attack surface' });
  }
});

/**
 * compliance-summary: Aggregated scores per framework based on live vulnerabilities
 */
router.get('/compliance-summary', authenticate, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    
    // Calculate dynamic risk based on open vulnerabilities
    const v = await query(`
      SELECT severity, COUNT(*) as count 
      FROM vulnerabilities 
      WHERE org_id = $1 AND status != 'closed'
      GROUP BY severity
    `, [orgId]);

    let criticalCount = 0;
    let highCount = 0;
    
    v.rows.forEach(r => {
       if (r.severity === 'critical') criticalCount = parseInt(r.count);
       if (r.severity === 'high') highCount = parseInt(r.count);
    });

    // Dynamic penalty calculation
    const penalty = (criticalCount * 15) + (highCount * 5);
    const baseScore = Math.max(0, 100 - penalty);

    // Apply framework-specific weighting
    const scores = { 
       iso: Math.min(100, baseScore + 5),   // ISO gets slight boost if controls are in place
       nist: Math.min(100, baseScore),      // NIST is strict
       gdpr: Math.min(100, baseScore + 10)  // GDPR depends heavily on data exposure
    };

    res.json({ scores });
  } catch (err) {
    logger.error('Compliance Logic Error:', err);
    res.status(500).json({ error: 'Failed to fetch compliance summary' });
  }
});

// ── SERVICES ──────────────────────────────────────────────────────────────────

router.get('/services', async (req, res) => {
  try {
    const r = await query('SELECT * FROM services ORDER BY name ASC');
    res.json({ services: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

module.exports = router;
