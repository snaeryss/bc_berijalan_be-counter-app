import { Request, Response, NextFunction } from "express";
import {
  SClaimQueue,
  SReleaseQueue,
  SGetCurrentQueues,
  SNextQueue,
  SSkipQueue,
  SResetQueues,
  SGetMetrics,
  SSearchQueues,
  SGetAllQueues,
  SGetQueueById,
  SCreateQueue,
  SUpdateQueue,
  SUpdateQueueStatus,
  SDeleteQueue,
  SBulkDeleteQueues,
  SServeQueue,
  SGetActiveQueueByCounterId, 
} from "../services/queue.service";
import { AppError } from "../errors/AppError";

export const CClaimQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SClaimQueue();

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const CGetMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SGetMetrics();

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CReleaseQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { queue_number, counter_id } = req.body;

    const result = await SReleaseQueue(queue_number, counter_id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CGetCurrentQueues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SGetCurrentQueues();

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CSearchQueues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q } = req.query as { q?: string };
    const result = await SSearchQueues(q);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CNextQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const counter_id = parseInt(req.params.counter_id);

    if (isNaN(counter_id)) {
      throw AppError.badRequest("Invalid counter ID", null, "counter_id");
    }

    const result = await SNextQueue(counter_id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CSkipQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { counter_id } = req.body;

    const result = await SSkipQueue(counter_id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CResetQueues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { counter_id } = req.body;

    const result = await SResetQueues(counter_id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CGetAllQueues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      include_deleted = "false",
      status,
      counter_id,
      page = "1",
      limit = "20",
    } = req.query;

    const result = await SGetAllQueues(
      include_deleted === "true",
      status as string,
      counter_id ? parseInt(counter_id as string) : undefined,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CGetQueueById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw AppError.badRequest("Invalid queue ID", null, "id");
    }

    const result = await SGetQueueById(id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CCreateQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { counter_id, queue_number, status } = req.body;

    const result = await SCreateQueue(counter_id, queue_number, status);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const CUpdateQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw AppError.badRequest("Invalid queue ID", null, "id");
    }

    const { queue_number, status, counter_id } = req.body;

    const result = await SUpdateQueue(id, queue_number, status, counter_id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CUpdateQueueStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw AppError.badRequest("Invalid queue ID", null, "id");
    }

    const { status } = req.body;

    const result = await SUpdateQueueStatus(id, status);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CDeleteQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw AppError.badRequest("Invalid queue ID", null, "id");
    }

    const result = await SDeleteQueue(id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CBulkDeleteQueues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw AppError.badRequest("IDs must be a non-empty array", null, "ids");
    }
    const result = await SBulkDeleteQueues(ids);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CServeQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { counter_id } = req.body;
    const result = await SServeQueue(counter_id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CGetActiveQueueByCounterId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const counter_id = parseInt(req.params.counter_id);
    if (isNaN(counter_id)) {
      throw AppError.badRequest("Invalid counter ID", null, "counter_id");
    }
    const result = await SGetActiveQueueByCounterId(counter_id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
