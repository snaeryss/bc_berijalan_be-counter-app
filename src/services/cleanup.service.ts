import { EQueueStatus, PrismaClient } from "@prisma/client";
import { publishQueueUpdate } from "../config/redis.config";
import {
  CleanupResult,
  CleanupByStatusResult,
  CleanupPreview,
  FullCleanupResult,
} from "../interfaces/job.interface";

const prisma = new PrismaClient();

const calculateCutoffDate = (daysOld: number): Date => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  return cutoffDate;
};

const logCleanupStart = (
  daysOld: number,
  cutoffDate: Date,
  statuses?: string[]
): void => {
  if (statuses) {
    console.log(
      `Starting queue cleanup for statuses [${statuses.join(
        ", "
      )}] older than ${daysOld} day(s)`
    );
  } else {
    console.log(
      `Starting queue cleanup for data older than ${daysOld} day(s) (before ${cutoffDate.toISOString()})`
    );
  }
};

const publishCleanupResult = async (
  deletedCount: number,
  event: "cleanup" | "cleanup_by_status",
  statuses?: string[]
): Promise<void> => {
  if (deletedCount > 0) {
    const message = statuses
      ? `Cleaned up ${deletedCount} expired queue entries with statuses: ${statuses.join(
          ", "
        )}`
      : `Cleaned up ${deletedCount} expired queue entries`;

    await publishQueueUpdate({
      event,
      message,
      timestamp: new Date(),
      deletedCount,
      ...(statuses && { cleanedStatuses: statuses }),
    });
  }
};

export const cleanupExpiredQueues = async (
  daysOld: number = 1
): Promise<CleanupResult> => {
  try {
    const cutoffDate = calculateCutoffDate(daysOld);
    logCleanupStart(daysOld, cutoffDate);

    const deleteResult = await prisma.queue.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    const deletedCount = deleteResult.count;
    const message = `Successfully cleaned up ${deletedCount} expired queue entries`;

    console.log(`${message}`);

    await publishCleanupResult(deletedCount, "cleanup");

    return {
      deletedCount,
      message,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error during queue cleanup:", error);
    throw new Error(
      `Queue cleanup failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const cleanupExpiredQueuesByStatus = async (
  statuses: EQueueStatus[] = ["SERVED", "SKIPPED", "RELEASED"],
  daysOld: number = 1
): Promise<CleanupByStatusResult> => {
  try {
    const cutoffDate = calculateCutoffDate(daysOld);
    logCleanupStart(daysOld, cutoffDate, statuses);

    const deleteResult = await prisma.queue.deleteMany({
      where: {
        AND: [
          {
            createdAt: {
              lt: cutoffDate,
            },
          },
          {
            status: {
              in: statuses,
            },
          },
        ],
      },
    });

    const deletedCount = deleteResult.count;
    const message = `Successfully cleaned up ${deletedCount} expired queue entries with statuses: ${statuses.join(
      ", "
    )}`;

    console.log(`${message}`);

    await publishCleanupResult(deletedCount, "cleanup_by_status", statuses);

    return {
      deletedCount,
      message,
      timestamp: new Date(),
      cleanedStatuses: statuses,
    };
  } catch (error) {
    console.error("Error during queue cleanup by status:", error);
    throw new Error(
      `Queue cleanup by status failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getCleanupPreview = async (
  daysOld: number = 1
): Promise<CleanupPreview> => {
  try {
    const cutoffDate = calculateCutoffDate(daysOld);

    const totalExpiredCount = await prisma.queue.count({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    const expiredByStatusResult = await prisma.queue.groupBy({
      by: ["status"],
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
      _count: {
        id: true,
      },
    });

    const expiredByStatus: Record<string, number> = {};
    expiredByStatusResult.forEach((item) => {
      expiredByStatus[item.status] = item._count.id;
    });

    const oldestEntry = await prisma.queue.findFirst({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        createdAt: true,
      },
    });

    return {
      totalExpiredCount,
      expiredByStatus,
      oldestEntry: oldestEntry?.createdAt || null,
      cutoffDate,
    };
  } catch (error) {
    console.error("Error getting cleanup preview:", error);
    throw new Error(
      `Cleanup preview failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const cleanupQueueCache = async (): Promise<void> => {
  try {
    console.log("Cleaning up queue-related cache...");

    await publishQueueUpdate({
      event: "cache_cleanup",
      message: "Queue cache cleanup triggered",
      timestamp: new Date(),
    });

    console.log("Queue cache cleanup completed");
  } catch (error) {
    console.error("Error during queue cache cleanup:", error);
  }
};

export const fullCleanup = async (
  daysOld: number = 1
): Promise<FullCleanupResult> => {
  try {
    console.log("Starting full queue cleanup...");

    const queueCleanup = await cleanupExpiredQueues(daysOld);

    await cleanupQueueCache();

    console.log("Full cleanup completed successfully");

    return {
      queueCleanup,
      cacheCleanup: true,
    };
  } catch (error) {
    console.error("Error during full cleanup:", error);
    throw error;
  }
};
