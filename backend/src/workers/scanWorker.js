/**
 * Chayil SecureX — Automated Scan Worker
 * 
 * Powered by BullMQ & Redis.
 * Handles background execution of security tools within Docker sandboxes.
 */

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { runTool } = require('../services/toolEngine');
const { query } = require('../utils/db');
const logger = require('../utils/logger');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const scanWorker = new Worker('scan-jobs', async (job) => {
  const { tool, target, options, orgId, userId, scanId, pipelineId } = job.data;
  
  logger.info(`🛰️ Worker processing job ${job.id}: ${tool} on ${target}`);
  
  try {
    // 1. Update status to 'running'
    await query('UPDATE scans SET status=$1, started_at=NOW() WHERE id=$2', ['running', scanId]);

    // 2. Execute the tool
    const result = await runTool({ tool, target, options, orgId, userId });

    // 3. Normalized storage logic
    await query(`
      UPDATE scans 
      SET status=$1, 
          result_raw=$2, 
          result_json=$3, 
          risk_score=$4, 
          findings_count=$5, 
          completed_at=NOW() 
      WHERE id=$6
    `, [
      'completed', 
      result.raw, 
      JSON.stringify(result.parsed), 
      result.parsed.summary?.risk_score || 0,
      result.parsed.summary?.findingsCount || result.parsed.findings?.length || 0,
      scanId
    ]);

    // 4. If part of a pipeline, update pipeline status
    if (pipelineId) {
       const p = await query('SELECT steps, current_stage FROM scan_pipelines WHERE id=$1', [pipelineId]);
       const pipeline = p.rows[0];
       if (pipeline) {
          const updatedSteps = pipeline.steps.map(s => 
             s.tool === tool ? { ...s, status: 'completed', result_id: scanId } : s
          );
          
          // Determine next stage or complete
          const currentIdx = updatedSteps.findIndex(s => s.status === 'pending');
          const nextStage = currentIdx !== -1 ? updatedSteps[currentIdx].stage : 'all_completed';
          const pipelineStatus = nextStage === 'all_completed' ? 'completed' : 'running';

          await query('UPDATE scan_pipelines SET steps=$1, current_stage=$2, status=$3, updated_at=NOW() WHERE id=$4',
             [JSON.stringify(updatedSteps), nextStage, pipelineStatus, pipelineId]);
          
          // TODO: Trigger next job in queue if automatic
       }
    }

    logger.info(`✅ Job ${job.id} completed successfully`);
    return { success: true };

  } catch (err) {
    logger.error(`❌ Job ${job.id} failed: ${err.message}`);
    await query('UPDATE scans SET status=$1, completed_at=NOW() WHERE id=$2', ['failed', scanId]);
    throw err;
  }
}, { connection });

logger.info('🚀 Chayil Scan Worker initialized and listening for jobs');

module.exports = scanWorker;
