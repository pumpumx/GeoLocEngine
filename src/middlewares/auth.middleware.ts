// middlewares/AuthMiddleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { AppError } from "./appError.middleware";

interface JwtPayload {
  _id: string;
  email: string;
  role?: string;
}

class AuthMiddleware {
  public authenticate = (
    req: Request,
    _: Response,
    next: NextFunction,
  ): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new AppError("Authorization header missing", 401);
      }

      const [scheme, token] = authHeader.split(" ");

      if (scheme !== "Bearer" || !token) {
        throw new AppError("Invalid authorization format", 401);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      req.user = {
        _id: decoded._id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      next(new AppError("Invalid or expired token", 401));
    }
  };
}

export default AuthMiddleware;
