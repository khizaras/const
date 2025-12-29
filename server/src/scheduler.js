/**
 * Scheduled Jobs Runner
 * Uses node-cron for scheduling background tasks
 */
const cron = require("node-cron");
const { logger } = require("./logger");

const jobs = [];

/**
 * Register a job to run on a cron schedule
 * @param {string} name - Job name for logging
 * @param {string} cronExpression - Cron expression (e.g., '0 9 * * *' for 9 AM daily)
 * @param {Function} handler - Async function to execute
 */
function registerJob(name, cronExpression, handler) {
  const task = cron.schedule(
    cronExpression,
    async () => {
      const startTime = Date.now();
      logger.info(`[Scheduler] Starting job: ${name}`);
      try {
        await handler();
        logger.info(
          `[Scheduler] Job ${name} completed in ${Date.now() - startTime}ms`
        );
      } catch (error) {
        logger.error(`[Scheduler] Job ${name} failed: ${error.message}`);
      }
    },
    {
      scheduled: true,
      timezone: process.env.TZ || "UTC",
    }
  );

  jobs.push({ name, cronExpression, task });
  logger.info(`[Scheduler] Registered job: ${name} (${cronExpression})`);

  return task;
}

/**
 * Run a job immediately (for testing or manual trigger)
 */
async function runJobNow(name) {
  const job = jobs.find((j) => j.name === name);
  if (!job) {
    throw new Error(`Job not found: ${name}`);
  }
  logger.info(`[Scheduler] Manually triggering job: ${name}`);
  // Find and execute the registered handler
  // Since cron jobs don't expose the handler, we need to track it separately
  throw new Error("Manual trigger not implemented - use direct service call");
}

/**
 * Stop all scheduled jobs
 */
function stopAllJobs() {
  for (const job of jobs) {
    job.task.stop();
    logger.info(`[Scheduler] Stopped job: ${job.name}`);
  }
}

/**
 * Initialize all scheduled jobs
 */
function initializeScheduler() {
  // Only run scheduler if enabled
  if (process.env.DISABLE_SCHEDULER === "true") {
    logger.info("[Scheduler] Scheduler is disabled via DISABLE_SCHEDULER env");
    return;
  }

  // Import job handlers
  const { processOverdueRfis } = require("./modules/rfis/sla.service");

  // SLA check - run daily at 9 AM
  registerJob("SLA Check", "0 9 * * *", processOverdueRfis);

  // Additional job: run every 4 hours for more frequent checks (optional)
  // registerJob('SLA Check (frequent)', '0 */4 * * *', processOverdueRfis);

  logger.info("[Scheduler] All scheduled jobs initialized");
}

module.exports = {
  registerJob,
  runJobNow,
  stopAllJobs,
  initializeScheduler,
};
