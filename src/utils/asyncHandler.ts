import { Request, Response, NextFunction } from "express";
import { ServerError } from "./errors";

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      if (!error.statusCode) {
        next(new ServerError(error.message));
      } else {
        next(error);
      }
    });
  };
