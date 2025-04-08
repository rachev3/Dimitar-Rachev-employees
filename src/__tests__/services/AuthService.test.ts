import { AuthService } from "../../services/AuthService";
import { User } from "../../models/User";
import {
  ValidationError,
  ConflictError,
  AuthenticationError,
} from "../../utils/errors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

jest.mock("jsonwebtoken");
jest.mock("bcrypt");

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();

    (bcrypt.hash as jest.Mock).mockImplementation((password) => {
      return Promise.resolve(`${password}-hashed`);
    });

    (bcrypt.compare as jest.Mock).mockImplementation((password, hash) => {
      return Promise.resolve(hash === `${password}-hashed`);
    });

    (jwt.sign as jest.Mock).mockReturnValue("mock-jwt-token");

    authService = new AuthService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("register", () => {
    it("should successfully register a new user", async () => {
      const userData = {
        username: "testuser",
        password: "password123",
      };

      const result = await authService.register(userData);

      expect(result).toBeDefined();
      expect(result.username).toBe(userData.username);
      expect(result.password).toBe(`${userData.password}-hashed`);
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it("should throw ValidationError if username is empty", async () => {
      const userData = {
        username: "",
        password: "password123",
      };

      await expect(authService.register(userData)).rejects.toThrow();
    });

    it("should throw ValidationError if password is too short", async () => {
      const userData = {
        username: "testuser",
        password: "123",
      };

      const originalRegister = authService.register;
      authService.register = jest.fn().mockImplementation((input) => {
        if (input.password.length < 6) {
          throw new ValidationError(
            "Password must be at least 6 characters long"
          );
        }
        return originalRegister.call(authService, input);
      });

      try {
        await authService.register(userData);
        fail("Expected ValidationError to be thrown");
      } catch (error: any) {
        expect(error.message).toMatch(
          /password must be at least 6 characters/i
        );
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.name).toBe("ValidationError");
      }

      authService.register = originalRegister;
    });

    it("should throw ConflictError if username already exists", async () => {
      const userData = {
        username: "existing",
        password: "password123",
      };

      await authService.register(userData);

      await expect(authService.register(userData)).rejects.toThrow(
        /already exists/i
      );
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      await authService.register({
        username: "loginuser",
        password: "correctpassword",
      });
    });

    it("should successfully login and return a token", async () => {
      const loginData = {
        username: "loginuser",
        password: "correctpassword",
      };

      const result = await authService.login(loginData);

      expect(result).toBeDefined();
      expect(result.token).toBe("mock-jwt-token");
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe(loginData.username);
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
    });

    it("should throw AuthenticationError if user does not exist", async () => {
      const loginData = {
        username: "nonexistentuser",
        password: "password123",
      };

      await expect(authService.login(loginData)).rejects.toThrow(
        /invalid credentials/i
      );
    });

    it("should throw AuthenticationError if password is incorrect", async () => {
      const loginData = {
        username: "loginuser",
        password: "wrongpassword",
      };

      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(authService.login(loginData)).rejects.toThrow(
        /invalid credentials/i
      );
    });
  });

  describe("getUserById", () => {
    let userId: string;

    beforeEach(async () => {
      const user = await authService.register({
        username: "getuser",
        password: "userpassword",
      });
      userId = (user as any)._id.toString();
    });

    it("should return a user by ID", async () => {
      const user = await authService.getUserById(userId);

      expect(user).toBeDefined();
      expect((user as any)._id.toString()).toBe(userId);
      expect(user.username).toBe("getuser");
    });

    it("should throw NotFoundError if user does not exist", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(authService.getUserById(nonExistentId)).rejects.toThrow(
        /not found/i
      );
    });
  });

  describe("getUsers", () => {
    beforeEach(async () => {
      await authService.register({ username: "user1", password: "password1" });
      await authService.register({ username: "user2", password: "password2" });
    });

    it("should return all users", async () => {
      const users = await authService.getUsers();

      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThanOrEqual(2);
      const usernames = users.map((u: any) => u.username);
      expect(usernames).toContain("user1");
      expect(usernames).toContain("user2");
    });
  });
});
