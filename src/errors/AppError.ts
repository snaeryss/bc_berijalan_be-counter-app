export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public field?: string;
  public errorDetail?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorDetail?: any,
    field?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.field = field;
    this.errorDetail = errorDetail;

    Error.captureStackTrace(this, this.constructor);
  }

  // static method untuk beberapa error code yang sering digunakan
  static badRequest(
    message: string = "Bad Request",
    errorDetail?: any,
    field?: string
  ): AppError {
    return new AppError(message, 400, errorDetail, field);
  }

  static unauthorized(
    message: string = "Unauthorized",
    errorDetail?: any
  ): AppError {
    return new AppError(message, 401, errorDetail);
  }

  static forbidden(message: string = "Forbidden", errorDetail?: any): AppError {
    return new AppError(message, 403, errorDetail);
  }

  static notFound(
    message: string = "Resource not found",
    errorDetail?: any
  ): AppError {
    return new AppError(message, 404, errorDetail);
  }

  static conflict(message: string = "Conflict", errorDetail?: any): AppError {
    return new AppError(message, 409, errorDetail);
  }

  static validation(
    message: string,
    field?: string,
    errorDetail?: any
  ): AppError {
    return new AppError(message, 400, errorDetail, field);
  }

  static internalServerError(
    message: string = "Internal Server Error",
    errorDetail?: any
  ): AppError {
    return new AppError(message, 500, errorDetail);
  }
}
