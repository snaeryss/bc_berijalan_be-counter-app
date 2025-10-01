import * as cron from "node-cron";
import {
  cleanupExpiredQueuesByStatus,
  cleanupQueueCache,
  fullCleanup,
  getCleanupPreview,
} from "../services/cleanup.service";
import { JobConfig, JobStatus } from "../interfaces/job.interface";
import { JOB_CONFIGS } from "../constants/job.constant";

const jobs = new Map<string, cron.ScheduledTask>();

const createCronTask = (
  expression: string,
  taskFunction: () => Promise<void>,
  timezone: string = "Asia/Jakarta"
): cron.ScheduledTask => {
  return cron.schedule(
    expression,
    async () => {
      try {
        await taskFunction();
      } catch (error) {
        console.error("Cron task failed:", error);
      }
    },
    { timezone }
  );
};

const scheduleQueueCleanup = (): void => {
  const taskFunction = async () => {
    console.log("Running scheduled queue cleanup...");
    const result = await fullCleanup(1); // Hapus data lebih dari 1 hari
    console.log("Cleanup results:", result);
  };

  const task = createCronTask("0 2 * * *", taskFunction);
  jobs.set("queueCleanup", task);
  console.log("Queue cleanup job scheduled: Every day at 02:00 (Asia/Jakarta)");
};

const scheduleCacheCleanup = (): void => {
  const taskFunction = async () => {
    console.log("Running scheduled cache cleanup...");
    await cleanupQueueCache();
  };

  const task = createCronTask("0 */6 * * *", taskFunction);
  jobs.set("cacheCleanup", task);
  console.log("Cache cleanup job scheduled: Every 6 hours");
};

const scheduleCleanupPreview = (): void => {
  const taskFunction = async () => {
    console.log("Running cleanup preview...");
    const preview = await getCleanupPreview(1);
    console.log("Cleanup preview:", {
      totalExpiredCount: preview.totalExpiredCount,
      expiredByStatus: preview.expiredByStatus,
      cutoffDate: preview.cutoffDate,
      oldestEntry: preview.oldestEntry,
    });

    if (preview.totalExpiredCount > 0) {
      console.log(
        `${preview.totalExpiredCount} queue entries will be cleaned up in 10 minutes`
      );
    } else {
      console.log("No queue entries to cleanup");
    }
  };

  const task = createCronTask("50 1 * * *", taskFunction);
  jobs.set("cleanupPreview", task);
  console.log(
    "Cleanup preview job scheduled: Every day at 01:50 (Asia/Jakarta)"
  );
};

export const scheduleStatusCleanup = (): void => {
  const taskFunction = async () => {
    console.log("Running scheduled status-based cleanup...");
    const result = await cleanupExpiredQueuesByStatus(
      ["SERVED", "SKIPPED", "RELEASED"],
      2
    );
    console.log("Status cleanup results:", result);
  };

  const task = createCronTask("0 3 * * *", taskFunction);
  jobs.set("statusCleanup", task);
  console.log(
    "Status cleanup job scheduled: Every day at 03:00 (Asia/Jakarta)"
  );
};

export const initializeCronJobs = (): void => {
  console.log("Initializing cron jobs...");

  scheduleQueueCleanup();

  scheduleCacheCleanup();

  scheduleCleanupPreview();

  console.log("All cron jobs initialized successfully");
};

export const getCronJobsStatus = (): Record<string, JobStatus> => {
  const status: Record<string, JobStatus> = {};

  JOB_CONFIGS.forEach((config) => {
    if (jobs.has(config.name)) {
      status[config.name] = {
        name: config.description,
        expression: config.expression,
      };
    }
  });

  return status;
};

export const runJobManually = async (jobName: string): Promise<void> => {
  console.log(`Running job manually: ${jobName}`);

  const jobExecutors: Record<string, () => Promise<void>> = {
    queueCleanup: async () => {
      await fullCleanup(1);
    },
    cacheCleanup: () => cleanupQueueCache(),
    cleanupPreview: async () => {
      const preview = await getCleanupPreview(1);
      console.log("Manual cleanup preview:", preview);
    },
    statusCleanup: async () => {
      await cleanupExpiredQueuesByStatus(["SERVED", "SKIPPED", "RELEASED"], 2);
    },
  };

  const executor = jobExecutors[jobName];
  if (!executor) {
    throw new Error(`Unknown job: ${jobName}`);
  }

  await executor();
  console.log(`Manual job completed: ${jobName}`);
};

export const stopCronJob = (jobName: string): boolean => {
  const job = jobs.get(jobName);
  if (job) {
    job.stop();
    console.log(`Job stopped: ${jobName}`);
    return true;
  }
  return false;
};

export const startCronJob = (jobName: string): boolean => {
  const job = jobs.get(jobName);
  if (job) {
    job.start();
    console.log(`Job started: ${jobName}`);
    return true;
  }
  return false;
};

export const stopAllCronJobs = (): void => {
  console.log("Stopping all cron jobs...");
  jobs.forEach((task, name) => {
    task.stop();
    console.log(`Stopped job: ${name}`);
  });
};

export const getAvailableCronJobs = (): string[] => {
  return Array.from(jobs.keys());
};

export const validateCronExpression = (expression: string): boolean => {
  return cron.validate(expression);
};

export const getJobConfig = (jobName: string): JobConfig | undefined => {
  return JOB_CONFIGS.find((config) => config.name === jobName);
};
