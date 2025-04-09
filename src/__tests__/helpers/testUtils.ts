import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ConflictError,
  AuthorizationError,
} from "../../utils/errors";

export function createValidationError(
  message = "Validation failed",
  errors = []
) {
  return new ValidationError(message, errors);
}

export function createNotFoundError(message = "Resource not found", path = "") {
  return new NotFoundError(message, path);
}

export function createAuthenticationError(message = "Authentication failed") {
  return new AuthenticationError(message);
}

export function createConflictError(
  message = "Resource already exists",
  path = "",
  value = null
) {
  return new ConflictError(message, path, value);
}

export function createAuthorizationError(message = "Not authorized") {
  return new AuthorizationError(message);
}

export function expectErrorType(
  fn: () => Promise<any>,
  ErrorClass: { name: string },
  errorMessage?: string | RegExp
) {
  if (errorMessage instanceof RegExp) {
    return expect(fn).rejects.toMatchObject({
      name: ErrorClass.name,
      message: expect.stringMatching(errorMessage),
    });
  }
  return expect(fn).rejects.toEqual(
    expect.objectContaining({
      name: ErrorClass.name,
      message: errorMessage ? errorMessage : expect.any(String),
    })
  );
}

export function expectErrorResponse(
  error: any,
  statusCode: number,
  errorCode: string
) {
  expect(error.statusCode).toBe(statusCode);
  expect(error.code).toBe(errorCode);
  expect(error.isOperational).toBeTruthy();
}

export const edgeCases = {
  emptyString: "",
  veryLongString: "a".repeat(1000),
  specialChars: "!@#$%^&*()_+{}|:<>?",
  malformedObjectId: "not-an-object-id",

  timeout: () =>
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), 100)
    ),

  networkError: new Error("Network error"),

  dbConnectionError: new Error("Database connection error"),

  malformedJson: "{not-valid-json",

  noSqlInjection: '{"$ne": null}',
  xssAttempt: "<script>alert('xss')</script>",
};

export function verifySuccessResponse(response: any, expectedData: any) {
  expect(response).toHaveProperty("success", true);

  Object.keys(expectedData).forEach((key) => {
    expect(response).toHaveProperty(key);

    if (Array.isArray(response[key]) && Array.isArray(expectedData[key])) {
      expect(response[key]).toHaveLength(expectedData[key].length);
    }

    if (
      typeof expectedData[key] === "object" &&
      !Array.isArray(expectedData[key])
    ) {
      Object.keys(expectedData[key]).forEach((prop) => {
        expect(response[key]).toHaveProperty(prop);
      });
    }
  });
}

export function testTimeout(promiseFn: () => Promise<any>, timeoutMs = 100) {
  jest.useFakeTimers();
  const promise = promiseFn();
  jest.advanceTimersByTime(timeoutMs);
  return promise;
}

describe("Test Utils", () => {
  it("satisfies Jest requirement for test files", () => {
    expect(true).toBe(true);
  });
});
