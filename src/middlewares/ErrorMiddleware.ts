import { Request, Response, NextFunction } from "express";
import {
  Middleware,
  ExpressErrorMiddlewareInterface,
} from "routing-controllers";
import { Service } from "typedi";
import { AppError, InputValidationError } from "../utils/errors";
import { ENV } from "../config/env";

interface ErrorResponse {
  success: false;
  message: string;
  error: {
    type: string;
    statusCode: number;
    details?: any;
    path?: string;
    value?: any;
    code?: string;
  };
}

@Service()
@Middleware({ type: "after" })
export class ErrorMiddleware implements ExpressErrorMiddlewareInterface {
  error(error: any, _req: Request, res: Response, _next: NextFunction) {
    // Log error in development
    if (ENV.NODE_ENV === "development") {
      console.error("Error details:", error);
    }

    const response: ErrorResponse = {
      success: false,
      message: "Internal server error",
      error: {
        type: "InternalServerError",
        statusCode: 500,
      },
    };

    if (error instanceof AppError) {
      response.message = error.message;
      response.error = {
        type: error.type || error.name,
        statusCode: error.statusCode,
      };

      // Add any additional error details if they exist
      if (error.path) response.error.path = error.path;
      if (error.value) response.error.value = error.value;
      if (error.code) response.error.code = error.code;
      if (error instanceof InputValidationError) {
        response.error.type = "InputValidationError";
      }

      return res.status(error.statusCode).json(response);
    }

    // Handle unknown errors
    if (ENV.NODE_ENV === "development") {
      console.error("Unhandled error:", error);
    }

    return res.status(500).json(response);
  }

  static catchAsync(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}
