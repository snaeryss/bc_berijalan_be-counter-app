import { Request, Response, NextFunction } from "express";
import {
  SGetAllCounters,
  SGetCounterById,
  SCreateCounter,
  SUpdateCounter,
  SDeleteCounter,
  SUpdateCounterStatus,
} from "../services/counter.service";
import { AppError } from "../errors/AppError";

export const CGetAllCounters = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SGetAllCounters(req.query.include_inactive === "true");

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CGetCounterById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const result = await SGetCounterById(id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CCreateCounter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, max_queue, is_active } = req.body;
    const result = await SCreateCounter(name, max_queue, is_active);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const CUpdateCounter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { name, max_queue, is_active } = req.body;

    const result = await SUpdateCounter(id, name, max_queue, is_active);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CDeleteCounter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const result = await SDeleteCounter(id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CUpdateCounterStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw AppError.badRequest("Invalid counter ID", null, "id");
    }

    const { status } = req.body;

    const result = await SUpdateCounterStatus(id, status);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
