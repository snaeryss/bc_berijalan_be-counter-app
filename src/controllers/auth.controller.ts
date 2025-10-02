import { Request, Response, NextFunction } from "express";
import {
  SLogin,
  SCreateAdmin,
  SUpdateAdmin,
  SDeleteAdmin,
  SGetAllAdmins,
  SGetAdminById,
  SToggleAdminStatus,
} from "../services/auth.service";
import { AppError } from "../errors/AppError";

export const CLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;
    const result = await SLogin(username, password);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CCreateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password, email, name } = req.body;
    const result = await SCreateAdmin(username, email, name, password);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const CUpdateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw AppError.badRequest("Invalid ID format", null, "id");
    }

    const { username, password, email, name } = req.body;
    const result = await SUpdateAdmin(id, username, email, name, password);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CDeleteAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const result = await SDeleteAdmin(id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CGetAllAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SGetAllAdmins();

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CGetAdminById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const result = await SGetAdminById(id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CToggleAdminStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const result = await SToggleAdminStatus(id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
