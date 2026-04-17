const router = require('express').Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

router.post('/chat', authenticate, async (req, res) => {
  const { messages } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'your_anthropic_key') {
    return res.status(503).json({ 
      error: 'AI connection unavailable. Ensure your network and API key are configured.' 
    });
  }

  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: 'You are the Chayil SecureX AI Security Assistant. Help with cybersecurity questions accurately.',
      messages: messages
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });

    res.json(response.data);
  } catch (error) {
    logger.error('AI Proxy Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to communicate with AI provider' });
  }
});

module.exports = router;
