export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  path?: string;
  value?: any;
  code?: string;
  type?: string;
  invalidRows?: Array<{ rowNumber: number; reason: string }>;

  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true,
    properties: {
      path?: string;
      value?: any;
      code?: string;
      type?: string;
      invalidRows?: Array<{ rowNumber: number; reason: string }>;
    } = {}
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.path = properties.path;
    this.value = properties.value;
    this.code = properties.code;
    this.type = properties.type;
    this.invalidRows = properties.invalidRows;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public errors?: any[];

  constructor(message: string, errors?: any[]) {
    super(400, message, true, { code: "VALIDATION_ERROR" });
    this.name = "ValidationError";
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(401, message, true, { code: "AUTHENTICATION_ERROR" });
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Not authorized to access this resource") {
    super(403, message, true, { code: "AUTHORIZATION_ERROR" });
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", path?: string) {
    super(404, message, true, { path, code: "NOT_FOUND_ERROR" });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = "Resource already exists",
    path?: string,
    value?: any
  ) {
    super(409, message, true, { path, value, code: "CONFLICT_ERROR" });
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests, please try again later") {
    super(429, message, true, { code: "RATE_LIMIT_ERROR" });
    this.name = "RateLimitError";
  }
}

export class ServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(500, message, false, { code: "SERVER_ERROR" });
    this.name = "ServerError";
  }
}

export class InputValidationError extends AppError {
  constructor(message: string) {
    super(400, message, true, { type: "InputValidationError" });
    this.name = "InputValidationError";
  }
}

export class ParsingError extends AppError {
  constructor(
    message: string,
    invalidRows: Array<{ rowNumber: number; reason: string }>
  ) {
    super(400, message, true, {
      type: "ParsingError",
      invalidRows,
    });
    this.name = "ParsingError";
  }
}
