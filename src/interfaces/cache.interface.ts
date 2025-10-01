import { Request } from "express";

export interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
  skipCacheIf?: (req: Request) => boolean;
  invalidateOnMethods?: string[];
}
