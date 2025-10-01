export interface JobConfig {
  name: string;
  expression: string;
  description: string;
}

export interface JobStatus {
  name: string;
  expression: string;
}

export interface CleanupResult {
  deletedCount: number;
  message: string;
  timestamp: Date;
}

export interface CleanupByStatusResult extends CleanupResult {
  cleanedStatuses: string[];
}

export interface CleanupPreview {
  totalExpiredCount: number;
  expiredByStatus: Record<string, number>;
  oldestEntry: Date | null;
  cutoffDate: Date;
}

export interface FullCleanupResult {
  queueCleanup: CleanupResult;
  cacheCleanup: boolean;
}
