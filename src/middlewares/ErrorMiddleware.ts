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
    path?: string;
    statusCode?: number;
  };
  stack?: string;
}

@Service()
@Middleware({ type: "after" })
export class ErrorMiddleware implements ExpressErrorMiddlewareInterface {
  error(error: Error, req: Request, res: Response, next: NextFunction) {
    let statusCode = 500;
    const response: ErrorResponse = {
      success: false,
      message: "Internal Server Error",
    };

    // Log error in development and staging environments
    if (ENV.NODE_ENV === "development" || ENV.NODE_ENV === "staging") {
      console.error(`🔴 Error: ${error.message}`);
      console.error(error.stack);
    } else if (ENV.NODE_ENV === "production") {
      // In production only log server errors and operational errors
      if (
        statusCode >= 500 ||
        (error instanceof AppError && !error.isOperational)
      ) {
        console.error(`🔴 Error: ${error.message}`);
      }
    }

    if (error instanceof AppError) {
      statusCode = error.statusCode;
      response.message = error.message;
      response.error = {
        type: error.name,
        statusCode: error.statusCode,
      };

      if (error.name === "ValidationError" && (error as any).errors) {
        response.error.details = (error as any).errors;
      }
    }

    // Handle JWT errors
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

    // Handle MongoDB errors
    if (error.name === "CastError") {
      statusCode = 400;
      response.message = "Invalid ID format";
      response.error = {
        type: "ValidationError",
        path: (error as any).path,
      };
    }

    if (error.name === "MongoServerError" && (error as any).code === 11000) {
      statusCode = 409;
      response.message = "Duplicate field value";
      response.error = {
        type: "ConflictError",
        details: (error as any).keyValue,
      };
    }

    // Handle standard SyntaxError (like JSON parse errors)
    if (error instanceof SyntaxError && (error as any).status === 400) {
      statusCode = 400;
      response.message = "Invalid request syntax";
      response.error = {
        type: "ValidationError",
      };
    }

    // Handle validation library errors
    if (
      error.name === "ValidationError" ||
      (Array.isArray((error as any).errors) && (error as any).errors.length > 0)
    ) {
      statusCode = 400;
      response.message = "Validation failed";
      response.error = {
        type: "ValidationError",
        details: (error as any).errors || [],
      };
    }

    // Include stack trace in development
    if (ENV.NODE_ENV === "development") {
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

  static catchAsync(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}
