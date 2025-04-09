import { AuthController } from "../../controllers/AuthController";
import { AuthService } from "../../services/AuthService";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthenticationError,
} from "../../utils/errors";
import {
  adminUser,
  regularUser,
  createMockUser,
  validUserRegisterData,
  validUserLoginData,
  generateNonExistentId,
  mockServiceMethod,
  mockServiceMethodError,
} from "../helpers/fixtures";
import {
  createValidationError,
  createNotFoundError,
  createAuthenticationError,
  createConflictError,
  edgeCases,
  verifySuccessResponse,
  expectErrorType,
} from "../helpers/testUtils";

jest.mock("../../services/AuthService");

describe("AuthController", () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService() as jest.Mocked<AuthService>;
    authController = new AuthController(authService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("register", () => {
    it("should register a user and return formatted user object", async () => {
      const mockUser = createMockUser();
      mockServiceMethod(authService, "register", mockUser);

      const result = await authController.register(validUserRegisterData);

      expect(authService.register).toHaveBeenCalledWith(validUserRegisterData);
      verifySuccessResponse(result, {
        user: {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
        },
      });
    });

    it("should pass through validation errors from the service", async () => {
      const error = createValidationError("Username is required");
      mockServiceMethodError(authService, "register", error);

      await expectErrorType(
        () =>
          authController.register({ ...validUserRegisterData, username: "" }),
        ValidationError,
        "Username is required"
      );
    });

    it("should handle conflict errors when username already exists", async () => {
      const error = createConflictError("Username already exists");
      mockServiceMethodError(authService, "register", error);

      await expectErrorType(
        () => authController.register(validUserRegisterData),
        ConflictError,
        "Username already exists"
      );
    });

    it("should handle extremely long username input", async () => {
      const error = createValidationError("Username is too long");
      mockServiceMethodError(authService, "register", error);

      await expectErrorType(
        () =>
          authController.register({
            ...validUserRegisterData,
            username: edgeCases.veryLongString,
          }),
        ValidationError,
        "Username is too long"
      );
    });

    it("should handle special characters in inputs", async () => {
      const mockUser = createMockUser({ username: edgeCases.specialChars });
      mockServiceMethod(authService, "register", mockUser);

      const result = await authController.register({
        ...validUserRegisterData,
        username: edgeCases.specialChars,
      });

      expect(result.user.username).toBe(edgeCases.specialChars);
    });
  });

  describe("login", () => {
    it("should login a user and return token and formatted user object", async () => {
      const mockUser = createMockUser();
      const mockResult = {
        token: "jwt-token-123",
        user: mockUser,
      };

      mockServiceMethod(authService, "login", mockResult);

      const result = await authController.login(validUserLoginData);

      expect(authService.login).toHaveBeenCalledWith(validUserLoginData);
      verifySuccessResponse(result, {
        token: "jwt-token-123",
        user: {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
        },
      });
    });

    it("should handle authentication errors for invalid credentials", async () => {
      const error = createAuthenticationError("Invalid credentials");
      mockServiceMethodError(authService, "login", error);

      await expectErrorType(
        () =>
          authController.login({
            username: "nonexistent",
            password: "wrongpass",
          }),
        AuthenticationError,
        "Invalid credentials"
      );
    });

    it("should handle NoSQL injection attempt in username", async () => {
      const error = createAuthenticationError("Invalid credentials");
      mockServiceMethodError(authService, "login", error);

      await expectErrorType(
        () =>
          authController.login({
            username: edgeCases.noSqlInjection,
            password: "password123",
          }),
        AuthenticationError,
        "Invalid credentials"
      );
    });

    it("should handle XSS attempt in username", async () => {
      const error = createAuthenticationError("Invalid credentials");
      mockServiceMethodError(authService, "login", error);

      await expectErrorType(
        () =>
          authController.login({
            username: edgeCases.xssAttempt,
            password: "password123",
          }),
        AuthenticationError,
        "Invalid credentials"
      );
    });
  });

  describe("getUsers", () => {
    it("should return all users with formatted response", async () => {
      const mockUsers = [
        createMockUser({ id: "user-1", role: "admin" }),
        createMockUser({ id: "user-2" }),
      ];

      mockServiceMethod(authService, "getUsers", mockUsers);

      const result = await authController.getUsers();

      expect(authService.getUsers).toHaveBeenCalled();
      verifySuccessResponse(result, {
        users: mockUsers.map((user) => ({
          id: user.id,
          username: user.username,
          role: user.role,
        })),
      });
    });

    it("should handle database errors gracefully", async () => {
      const error = new Error("Database error");
      mockServiceMethodError(authService, "getUsers", error);

      await expect(authController.getUsers()).rejects.toThrow("Database error");
    });
  });

  describe("getUserById", () => {
    it("should return a user by id with formatted response", async () => {
      const userId = "user-id-123";
      const mockUser = createMockUser({ id: userId });

      mockServiceMethod(authService, "getUserById", mockUser);

      const result = await authController.getUserById(userId);

      expect(authService.getUserById).toHaveBeenCalledWith(userId);
      verifySuccessResponse(result, {
        user: {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
        },
      });
    });

    it("should handle user not found errors", async () => {
      const userId = generateNonExistentId();
      const error = createNotFoundError("User not found");

      mockServiceMethodError(authService, "getUserById", error);

      await expectErrorType(
        () => authController.getUserById(userId),
        NotFoundError,
        "User not found"
      );
    });

    it("should handle malformed ObjectId", async () => {
      const error = new Error("Invalid ObjectId");
      mockServiceMethodError(authService, "getUserById", error);

      await expect(
        authController.getUserById(edgeCases.malformedObjectId)
      ).rejects.toThrow("Invalid ObjectId");
    });
  });

  describe("updateUser", () => {
    it("should update a user when user is admin", async () => {
      const userId = "user-id-123";
      const updateData = { username: "newusername" };
      const mockUser = createMockUser({ id: userId, username: "newusername" });

      mockServiceMethod(authService, "updateUser", mockUser);

      const result = await authController.updateUser(
        userId,
        updateData,
        adminUser
      );

      expect(authService.updateUser).toHaveBeenCalledWith(userId, updateData);
      verifySuccessResponse(result, {
        user: {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
        },
      });
    });

    it("should update a user when user is updating own profile", async () => {
      const userId = regularUser.id;
      const updateData = { username: "newusername" };
      const mockUser = createMockUser({
        id: userId,
        username: "newusername",
      });

      mockServiceMethod(authService, "updateUser", mockUser);

      const result = await authController.updateUser(
        userId,
        updateData,
        regularUser
      );

      expect(authService.updateUser).toHaveBeenCalledWith(userId, updateData);
      verifySuccessResponse(result, {
        user: {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
        },
      });
    });

    it("should throw NotFoundError when regular user tries to update someone else's profile", async () => {
      const userId = "different-user-id";
      const updateData = { username: "newusername" };
      const differentUser = { ...regularUser, id: userId };

      await expect(
        authController.updateUser(userId, updateData, regularUser)
      ).rejects.toThrow("User not found");
    });

    it("should handle conflict errors when updating to existing username", async () => {
      const userId = regularUser.id;
      const updateData = { username: "existinguser" };
      const error = createConflictError("Username already exists");

      mockServiceMethodError(authService, "updateUser", error);

      await expectErrorType(
        () => authController.updateUser(userId, updateData, regularUser),
        ConflictError,
        "Username already exists"
      );
    });
  });

  describe("deleteUser", () => {
    it("should delete a user and return success message", async () => {
      const userId = "user-id-123";
      mockServiceMethod(authService, "deleteUser", undefined);

      const result = await authController.deleteUser(userId);

      expect(authService.deleteUser).toHaveBeenCalledWith(userId);
      verifySuccessResponse(result, {
        message: "User deleted successfully",
      });
    });

    it("should handle user not found errors", async () => {
      const userId = generateNonExistentId();
      const error = createNotFoundError("User not found");

      mockServiceMethodError(authService, "deleteUser", error);

      await expectErrorType(
        () => authController.deleteUser(userId),
        NotFoundError,
        "User not found"
      );
    });
  });
});
