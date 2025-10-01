import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { AppError } from "../errors/AppError";

export const MValidate = (
  schema: Joi.ObjectSchema,
  type: "body" | "params" | "query" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req[type], { abortEarly: false });

    if (error) {
      const validationError = error.details.map((detail) => {
        return AppError.validation(detail.message, detail.path.join("."));
      })[0];

      return next(validationError);
    }

    next();
  };
};
