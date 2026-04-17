/**
 * Chayil SecureX — Job Queue Infrastructure
 */

const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const scanQueue = new Queue('scan-jobs', { connection });

module.exports = { scanQueue };
