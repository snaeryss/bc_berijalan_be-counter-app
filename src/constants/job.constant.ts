import { JobConfig } from "../interfaces/job.interface";

export const JOB_CONFIGS: JobConfig[] = [
  {
    name: "queueCleanup",
    expression: "0 2 * * *",
    description: "Daily queue cleanup at 02:00",
  },
  {
    name: "cacheCleanup",
    expression: "0 */6 * * *",
    description: "Cache cleanup every 6 hours",
  },
  {
    name: "cleanupPreview",
    expression: "50 1 * * *",
    description: "Cleanup preview at 01:50",
  },
  {
    name: "statusCleanup",
    expression: "0 3 * * *",
    description: "Status-based cleanup at 03:00",
  },
];
