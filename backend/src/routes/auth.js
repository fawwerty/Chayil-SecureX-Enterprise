const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const { query } = require('../utils/db');
const { authenticate, auditLog, DEMO_USERS } = require('../middleware/auth');
const logger = require('../utils/logger');

const loginLimiter = rateLimit({ windowMs: 15 * 60000, max: 1000, message: { error: 'Too many login attempts' } });

// Demo passwords removed for production refinement.

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, orgId: user.org_id },
    process.env.JWT_SECRET || 'chayil_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

// POST /api/auth/login
router.post('/login', loginLimiter, auditLog('user_login'), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    // Try real DB
    let user = null;
    try {
      const r = await query('SELECT * FROM users WHERE email=$1 AND is_active=true', [email.toLowerCase()]);
      user = r.rows[0];
    } catch {}

    if (user) {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
      await query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);
      const token = signToken(user);
      return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, org_id: user.org_id } });
    }

    // Demo fallback removed.

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/logout', authenticate, auditLog('user_logout'), (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const r = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, r.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hash, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    logger.error(err); res.status(500).json({ error: 'Failed to change password' });
  }
});

// POST /api/auth/signup
router.post('/signup', auditLog('user_signup'), async (req, res) => {
  const { name, email, password, organization, company } = req.body;
  const orgName = organization || company; // Support both for compatibility
  
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    organization: Joi.string().max(200).optional(),
    company: Joi.string().max(200).optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const existing = await query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (existing.rows[0]) return res.status(400).json({ error: 'User already exists' });

    // Ensure Organization exists
    let orgId;
    if (orgName) {
      const orgResult = await query('SELECT id FROM organizations WHERE name = $1', [orgName]);
      if (orgResult.rows[0]) {
        orgId = orgResult.rows[0].id;
      } else {
        const newOrg = await query(
          'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
          [orgName]
        );
        orgId = newOrg.rows[0].id;
      }
    }

    const hash = await bcrypt.hash(password, 12);
    
    const r = await query(
      `INSERT INTO users (name, email, password_hash, role, org_id, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, org_id`,
      [name, email.toLowerCase(), hash, 'client', orgId, true]
    );

    const user = r.rows[0];
    const token = signToken(user);
    res.json({ token, user, message: 'Account created successfully' });
  } catch (err) {
    logger.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

module.exports = router;
