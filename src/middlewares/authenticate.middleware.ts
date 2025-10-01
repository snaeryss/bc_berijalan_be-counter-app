import { Request, Response, NextFunction } from "express";
import { UVerifyToken } from "../utils/jwt.util";
import { AppError } from "../errors/AppError";

export const MAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthorized();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw AppError.unauthorized();
    }

    const decoded = await UVerifyToken(token);
    req.admin = decoded as typeof req.admin;

    next();
  } catch (error) {
    next(AppError.unauthorized());
  }
};
