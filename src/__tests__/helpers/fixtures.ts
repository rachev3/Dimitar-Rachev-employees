import { UserPayload } from "../../types/UserPayload";
import mongoose from "mongoose";

export const adminUser: UserPayload = {
  id: "admin-id-123",
  username: "admin",
  role: "admin",
};

export const regularUser: UserPayload = {
  id: "user-id-123",
  username: "testuser",
  role: "user",
};

export const createMockUser = (overrides = {}) => ({
  id: "user-id-123",
  username: "testuser",
  password: "hashed-password",
  role: "user" as "user" | "admin",
  createdAt: new Date("2023-01-01"),
  updatedAt: new Date("2023-01-01"),
  ...overrides,
});

export const createMockProject = (overrides = {}) => ({
  id: "project-id-123",
  name: "Test Project",
  createdAt: new Date("2023-01-01"),
  updatedAt: new Date("2023-01-01"),
  ...overrides,
});

export const validUserRegisterData = {
  username: "newuser",
  password: "password123",
};

export const validUserLoginData = {
  username: "testuser",
  password: "password123",
};

export const validProjectData = {
  name: "New Project",
};

export const validationErrorData = {
  message: "Validation failed",
  errors: [{ field: "username", message: "Username is required" }],
};

export const notFoundErrorData = {
  message: "Resource not found",
  statusCode: 404,
  code: "NOT_FOUND_ERROR",
};

export const generateNonExistentId = () =>
  new mongoose.Types.ObjectId().toString();

export const mockDate = new Date("2023-01-01T00:00:00.000Z");

export function mockServiceMethod(
  service: any,
  method: string,
  returnValue: any
): jest.Mock {
  service[method] = jest.fn().mockResolvedValue(returnValue);
  return service[method];
}

export function mockServiceMethodError(
  service: any,
  method: string,
  error: Error
): jest.Mock {
  service[method] = jest.fn().mockRejectedValue(error);
  return service[method];
}

describe("Fixtures", () => {
  it("satisfies Jest requirement for test files", () => {
    expect(true).toBe(true);
  });
});
