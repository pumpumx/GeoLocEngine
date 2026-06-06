
import { NextFunction, Request, Response } from "express";
import { ZodObject, ZodError } from "zod";
import { AppError } from "./appError.middleware";

export const validate =
  (schema: ZodObject) =>
  (
    req: Request,
    _: Response,
    next: NextFunction
  ) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            error.issues
              .map((e) => e.message)
              .join(", "),
            400
          )
        );
      }

      next(error);
    }
  };