const { createClient } = require('redis');
const logger = require('./logger');

let redisClient = null;

async function connectRedis() {
  try {
    redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redisClient.on('error', err => logger.warn('Redis error:', err.message));
    await redisClient.connect();
    logger.info('✅ Redis connected');
  } catch (err) {
    logger.warn('⚠️  Redis not available — queues disabled');
    redisClient = null;
  }
}

function getRedis() { return redisClient; }

module.exports = { connectRedis, getRedis };
