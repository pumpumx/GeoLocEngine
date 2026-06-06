import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "./appError.middleware";

export const errorMiddleware = (
  err: any,
  _: Request,
  res: Response,
  __: NextFunction,
) => {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
};
