import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { IGlobalResponse } from "../interfaces/global.interface";

export const MErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error:", err);

  const isDevelopment = process.env.NODE_ENV === "development";

  if (err instanceof AppError) {
    const response: IGlobalResponse = {
      status: false,
      message: err.message,
    };

    const errorObj: any = { message: err.message };

    if (err.field) {
      errorObj.field = err.field;
    }

    if (isDevelopment && err.errorDetail) {
      errorObj.detail = err.errorDetail;
    }

    response.error = errorObj;

    res.status(err.statusCode).json(response);
  } else {
    const response: IGlobalResponse = {
      status: false,
      message: "An unexpected error occurred",
      error: {
        message: "Internal server error",
        ...(isDevelopment && { detail: err.stack }),
      },
    };

    res.status(500).json(response);
  }
};
