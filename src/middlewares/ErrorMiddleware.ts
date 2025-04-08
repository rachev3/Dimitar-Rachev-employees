import { Request, Response, NextFunction } from "express";
import {
  Middleware,
  ExpressErrorMiddlewareInterface,
} from "routing-controllers";
import { Service } from "typedi";
import { AppError } from "../utils/errors";
import { ENV } from "../config/env";

interface ErrorResponse {
  success: false;
  message: string;
  error?: {
    type: string;
    details?: any;
  };
  stack?: string;
}

@Service()
@Middleware({ type: "after" })
export class ErrorMiddleware implements ExpressErrorMiddlewareInterface {
  error(error: Error, req: Request, res: Response, next: NextFunction) {
    // Default to 500 server error
    let statusCode = 500;
    const response: ErrorResponse = {
      success: false,
      message: "Internal Server Error",
    };

    // Handle AppError instances
    if (error instanceof AppError) {
      statusCode = error.statusCode;
      response.message = error.message;
      response.error = {
        type: error.name,
      };

      // Include validation errors if any
      if (error.name === "ValidationError" && (error as any).errors) {
        response.error.details = (error as any).errors;
      }
    }

    // Handle JWT Errors
    if (error.name === "JsonWebTokenError") {
      statusCode = 401;
      response.message = "Invalid token";
      response.error = {
        type: "AuthorizationError",
      };
    }

    if (error.name === "TokenExpiredError") {
      statusCode = 401;
      response.message = "Token expired";
      response.error = {
        type: "AuthorizationError",
      };
    }

    // Handle Mongoose Errors
    if (error.name === "CastError") {
      statusCode = 400;
      response.message = "Invalid ID format";
      response.error = {
        type: "ValidationError",
      };
    }

    if (error.name === "MongoServerError" && (error as any).code === 11000) {
      statusCode = 409;
      response.message = "Duplicate field value";
      response.error = {
        type: "ConflictError",
      };
    }

    // Include stack trace only in development
    if (ENV.NODE_ENV === "development") {
      // Clean up the stack trace
      const stackLines = error.stack?.split("\n").map((line) => line.trim());
      if (stackLines) {
        response.stack = stackLines.join("\n");
      }
    }

    // Remove undefined properties
    Object.keys(response).forEach((key) => {
      if (response[key as keyof ErrorResponse] === undefined) {
        delete response[key as keyof ErrorResponse];
      }
    });

    res.status(statusCode).json(response);
  }

  // Catch async errors
  static catchAsync(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}
