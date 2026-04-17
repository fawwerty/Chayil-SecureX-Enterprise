const express = require('express');
const router = express.Router();
const { query } = require('../utils/db');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await query(
      `SELECT id, name, email, role, is_active, status, mfa_enabled, mac_clearance, access_rules, last_login 
       FROM users WHERE org_id=$1 ORDER BY created_at DESC`, 
      [req.user.org_id]
    );
    // Format JSON array for UI table structure
    const users = r.rows.map(u => ({
      ...u,
      mfa: u.mfa_enabled,
      last_login: u.last_login ? new Date(u.last_login).toLocaleString() : 'Never logged in'
    }));
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Invite / Create New User
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { name, email, role, mac_clearance } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'Name and email are required' });
  
  try {
    // Generate a temporary random password for invited users
    const crypto = require('crypto');
    const bcrypt = require('bcryptjs');
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hash = await bcrypt.hash(tempPassword, 12);

    const r = await query(
      `INSERT INTO users (name, email, password_hash, role, org_id, is_active, status, mac_clearance, mfa_enabled, access_rules) 
       VALUES ($1, $2, $3, $4, $5, true, 'active', $6, false, '{"domains": [], "time_restricted": false}'::jsonb) 
       RETURNING id, name, email, role, status, mfa_enabled, mac_clearance, access_rules, last_login`,
      [name, email.toLowerCase(), hash, role || 'client', req.user.org_id, mac_clearance || 'Unclassified']
    );
    
    // In a real system, we would email the tempPassword to the user here.
    const user = { ...r.rows[0], mfa: r.rows[0].mfa_enabled, last_login: 'Never logged in' };
    res.json({ message: 'User invited successfully', user, temp_password: tempPassword });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Failed to invite user' });
  }
});

// Update IAM settings (Role, MAC, DBAC, Status, MFA)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  const { role, status, mfa_enabled, mac_clearance, access_rules } = req.body;
  try {
    const r = await query(
      `UPDATE users 
       SET role = COALESCE($1, role), 
           status = COALESCE($2, status), 
           mfa_enabled = COALESCE($3, mfa_enabled), 
           mac_clearance = COALESCE($4, mac_clearance),
           access_rules = COALESCE($5, access_rules),
           updated_at = NOW()
       WHERE id = $6 AND org_id = $7
       RETURNING id, name, email, role, status, mfa_enabled, mac_clearance, access_rules, last_login`,
      [role, status, mfa_enabled, mac_clearance, JSON.stringify(access_rules), req.params.id, req.user.org_id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'User not found' });
    const user = { ...r.rows[0], mfa: r.rows[0].mfa_enabled };
    res.json({ message: 'IAM settings updated', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user access controls' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const r = await query(
      'SELECT id, name, email, role, org_id, status, mfa_enabled, mac_clearance, access_rules, last_login FROM users WHERE id=$1', 
      [req.user.id]
    );
    res.json({ user: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
