const express = require('express');
const router = express.Router();
const { query } = require('../utils/db');
const logger = require('../utils/logger');

router.post('/', async (req, res) => {
  const { name, email, phone, company, message, service } = req.body;
  try {
    const r = await query(
      `INSERT INTO contact_inquiries (name, email, phone, company, message, service) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, email, phone, company, message, service]
    );

    // Placeholder for sending email notifications if needed
    // ...

    res.json({ success: true, inquiry: r.rows[0] });
  } catch (err) {
    logger.error('Contact Inquiry Error:', err);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

module.exports = router;
