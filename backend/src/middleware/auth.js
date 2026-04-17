const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');
const logger = require('../utils/logger');

// Force real DB authentication for production refinement.
const DEMO_USERS = {};

async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chayil_secret_key');

    // Try DB, fall back to demo store
    let user = null;
    try {
      const r = await query('SELECT id,email,name,role,org_id FROM users WHERE id=$1 AND is_active=true', [decoded.userId]);
      user = r.rows[0];
    } catch (err) {
      logger.error('DB Auth Error:', err);
    }

    if (!user) return res.status(401).json({ error: 'User not found or inactive' });
    req.user = user;
    next();
  } catch (err) {
    logger.warn('Auth failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
    }
    next();
  };
}

function auditLog(action) {
  return async (req, res, next) => {
    const orig = res.json.bind(res);
    res.json = function(body) {
      // Log after response
      setImmediate(async () => {
        try {
          await query(`
            INSERT INTO audit_logs (user_id, org_id, action, resource, ip_address, user_agent, status, details)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          `, [
            req.user?.id, req.user?.org_id, action,
            req.path, req.ip, req.headers['user-agent'],
            res.statusCode < 400 ? 'success' : 'failure',
            JSON.stringify({ method: req.method, body: req.body, params: req.params }),
          ]);
        } catch {} // Don't fail on audit log error
      });
      return orig(body);
    };
    next();
  };
}

module.exports = { authenticate, authorize, auditLog, DEMO_USERS };
