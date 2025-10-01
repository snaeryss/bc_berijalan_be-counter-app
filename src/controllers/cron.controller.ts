import { Request, Response, NextFunction } from "express";
import {
  getCronJobsStatus,
  runJobManually,
  stopCronJob,
  startCronJob,
  getAvailableCronJobs,
  validateCronExpression,
} from "../config/cron.config";
import {
  getCleanupPreview,
  cleanupExpiredQueues,
  cleanupQueueCache,
  cleanupExpiredQueuesByStatus,
  fullCleanup,
} from "../services/cleanup.service";
import { IGlobalResponse } from "../interfaces/global.interface";

/**
 * Controller untuk mendapatkan status semua cron jobs
 */
export const CGetCronJobsStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const status = getCronJobsStatus();
    const availableJobs = getAvailableCronJobs();

    const result: IGlobalResponse = {
      status: true,
      message: "Cron jobs status retrieved successfully",
      data: {
        jobs: status,
        availableJobs,
        totalJobs: availableJobs.length,
      },
    };

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk menjalankan job secara manual
 */
export const CRunJobManually = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobName } = req.params;

    if (!jobName) {
      res.status(400).json({
        status: false,
        message: "Job name is required",
      });
      return;
    }

    const availableJobs = getAvailableCronJobs();
    if (!availableJobs.includes(jobName)) {
      res.status(404).json({
        status: false,
        message: `Job '${jobName}' not found. Available jobs: ${availableJobs.join(
          ", "
        )}`,
      });
      return;
    }

    // Jalankan job secara manual
    await runJobManually(jobName);

    const result: IGlobalResponse = {
      status: true,
      message: `Job '${jobName}' executed successfully`,
      data: {
        jobName,
        executedAt: new Date(),
      },
    };

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk start/stop job tertentu
 */
export const CControlJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobName } = req.params;
    const { action } = req.body; // "start" atau "stop"

    if (!jobName || !action) {
      res.status(400).json({
        status: false,
        message: "Job name and action (start/stop) are required",
      });
      return;
    }

    if (!["start", "stop"].includes(action)) {
      res.status(400).json({
        status: false,
        message: "Action must be either 'start' or 'stop'",
      });
      return;
    }

    let success = false;
    if (action === "start") {
      success = startCronJob(jobName);
    } else {
      success = stopCronJob(jobName);
    }

    if (!success) {
      res.status(404).json({
        status: false,
        message: `Job '${jobName}' not found`,
      });
      return;
    }

    const result: IGlobalResponse = {
      status: true,
      message: `Job '${jobName}' ${action}ed successfully`,
      data: {
        jobName,
        action,
        timestamp: new Date(),
      },
    };

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk mendapatkan preview cleanup
 */
export const CGetCleanupPreview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const daysOld = parseInt(req.query.daysOld as string) || 1;

    if (daysOld < 0 || daysOld > 365) {
      res.status(400).json({
        status: false,
        message: "daysOld must be between 0 and 365",
      });
      return;
    }

    const preview = await getCleanupPreview(daysOld);

    const result: IGlobalResponse = {
      status: true,
      message: "Cleanup preview retrieved successfully",
      data: preview,
    };

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk menjalankan cleanup manual
 */
export const CRunCleanupManually = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type = "full", daysOld = 1 } = req.body;

    if (!["full", "queue", "cache", "status"].includes(type)) {
      res.status(400).json({
        status: false,
        message: "Type must be one of: full, queue, cache, status",
      });
      return;
    }

    let cleanupResult: any;

    switch (type) {
      case "full":
        cleanupResult = await fullCleanup(daysOld);
        break;
      case "queue":
        cleanupResult = await cleanupExpiredQueues(daysOld);
        break;
      case "cache":
        await cleanupQueueCache();
        cleanupResult = {
          message: "Cache cleanup completed",
          timestamp: new Date(),
        };
        break;
      case "status":
        const { statuses = ["served", "skipped", "released"] } = req.body;
        cleanupResult = await cleanupExpiredQueuesByStatus(statuses, daysOld);
        break;
    }

    const result: IGlobalResponse = {
      status: true,
      message: `${type} cleanup executed successfully`,
      data: {
        type,
        daysOld,
        result: cleanupResult,
        executedAt: new Date(),
      },
    };

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk validasi cron expression
 */
export const CValidateCronExpression = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { expression } = req.body;

    if (!expression) {
      res.status(400).json({
        status: false,
        message: "Cron expression is required",
      });
      return;
    }

    const isValid = validateCronExpression(expression);

    const result: IGlobalResponse = {
      status: true,
      message: "Cron expression validation completed",
      data: {
        expression,
        isValid,
        examples: [
          "0 2 * * * - Every day at 02:00",
          "0 */6 * * * - Every 6 hours",
          "30 1 * * 0 - Every Sunday at 01:30",
          "0 0 1 * * - First day of every month at 00:00",
        ],
      },
    };

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
