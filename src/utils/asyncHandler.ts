import { Request, Response, NextFunction } from "express";
import { ServerError } from "./errors";

/**
 * Wraps an async function to catch any errors and pass them to the next middleware
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Convert unknown errors to ServerError for consistent handling
      if (!error.statusCode) {
        next(new ServerError(error.message));
      } else {
        next(error);
      }
    });
  };
