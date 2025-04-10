import { Request, Response, NextFunction } from "express";
import {
  Middleware,
  ExpressErrorMiddlewareInterface,
} from "routing-controllers";
import { Service } from "typedi";
import { AppError, InputValidationError, ParsingError } from "../utils/errors";
import { ENV } from "../config/env";

interface ErrorResponse {
  success: false;
  message: string;
  error: {
    type: string;
    statusCode: number;
    invalidRows?: Array<{ rowNumber: number; reason: string }>;
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
      message: error.message || "Internal server error",
      error: {
        type: "InternalServerError",
        statusCode: 500,
      },
    };

    if (error instanceof AppError) {
      response.error = {
        type: error.type || error.name,
        statusCode: error.statusCode,
      };

      // Add invalidRows if present (for ParsingError)
      if (error.invalidRows) {
        response.error.invalidRows = error.invalidRows;
      }

      // Add any additional error details if they exist
      if (error.path) response.error.path = error.path;
      if (error.value) response.error.value = error.value;
      if (error.code) response.error.code = error.code;
      if (error instanceof InputValidationError) {
        response.error.type = "InputValidationError";
      }
    }

    return res.status(response.error.statusCode).json(response);
  }

  static catchAsync(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}
