const router = require('express').Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

router.post('/chat', authenticate, async (req, res) => {
  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_key') {
    return res.status(503).json({ 
      error: 'AI connection unavailable. Ensure your GEMINI_API_KEY is configured in Render.' 
    });
  }

  // List of models to try in order of preference
  const models = [
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-pro',
    'gemini-2.5-flash'
  ];

  let lastError = null;

  for (const modelName of models) {
    try {
      logger.info(`Attempting AI generation with model: ${modelName}`);
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          contents: [{ role: "user", parts: [{ text: message }] }],
          systemInstruction: {
            parts: [{ text: 'You are the Chayil SecureX AI Security Assistant. Help with cybersecurity and GRC orchestration queries accurately and concisely.' }]
          }
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );

      const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        logger.info(`Successfully generated response with ${modelName}`);
        return res.json({ reply });
      }
    } catch (error) {
      lastError = error.response?.data?.error || error.message;
      logger.warn(`Model ${modelName} failed: ${JSON.stringify(lastError)}`);
      
      // If the error is 401 (Unauthenticated), there's no point in trying other models
      if (error.response?.status === 401) break;
    }
  }

  // If we reach here, all models failed
  logger.error('All AI models failed to respond.');
  res.status(500).json({ 
    error: 'The AI provider rejected the request.',
    details: lastError 
  });
});

module.exports = router;
