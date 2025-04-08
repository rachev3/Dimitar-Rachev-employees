import { Service } from "typedi";
import { User, IUser } from "../models/User";
import jwt, { SignOptions, Secret } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ENV } from "../config/env";
import {
  AuthenticationError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../utils/errors";

interface RegisterInput {
  username: string;
  password: string;
}

interface LoginInput {
  username: string;
  password: string;
}

interface UpdateUserInput {
  username?: string;
  password?: string;
}

@Service()
export class AuthService {
  private validateRegisterInput(input: any): asserts input is RegisterInput {
    if (!input?.username || typeof input.username !== "string") {
      throw new ValidationError("Username is required and must be a string");
    }
    if (!input?.password || typeof input.password !== "string") {
      throw new ValidationError("Password is required and must be a string");
    }
  }

  private validateLoginInput(input: any): asserts input is LoginInput {
    if (!input?.username || typeof input.username !== "string") {
      throw new ValidationError("Username is required and must be a string");
    }
    if (!input?.password || typeof input.password !== "string") {
      throw new ValidationError("Password is required and must be a string");
    }
  }

  private validateUpdateInput(input: any): asserts input is UpdateUserInput {
    if (input?.username !== undefined && typeof input.username !== "string") {
      throw new ValidationError("Username must be a string");
    }
    if (input?.password !== undefined && typeof input.password !== "string") {
      throw new ValidationError("Password must be a string");
    }
  }

  async register(input: any, role: "admin" | "user" = "user"): Promise<IUser> {
    this.validateRegisterInput(input);

    const existingUser = await User.findOne({ username: input.username });
    if (existingUser) {
      throw new ConflictError("User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(input.password, salt);

    const user = new User({
      username: input.username,
      password: hashedPassword,
      role,
    });

    await user.save();
    return user;
  }

  async login(input: any): Promise<{ token: string; user: IUser }> {
    this.validateLoginInput(input);

    const user = await User.findOne({ username: input.username });
    if (!user) {
      throw new AuthenticationError("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw new AuthenticationError("Invalid credentials");
    }

    const payload = { id: user.id, username: user.username, role: user.role };
    // @ts-ignore
    const token = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRATION,
    });

    return { token, user };
  }

  async getUsers(): Promise<IUser[]> {
    return User.find().select("-password");
  }

  async getUserById(userId: string): Promise<IUser> {
    if (!userId || typeof userId !== "string") {
      throw new ValidationError("Valid user ID is required");
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async updateUser(userId: string, input: any): Promise<IUser> {
    if (!userId || typeof userId !== "string") {
      throw new ValidationError("Valid user ID is required");
    }

    this.validateUpdateInput(input);

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (input.username) {
      const existingUser = await User.findOne({ username: input.username });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError("Username already taken");
      }
      user.username = input.username;
    }

    if (input.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(input.password, salt);
    }

    await user.save();
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    if (!userId || typeof userId !== "string") {
      throw new ValidationError("Valid user ID is required");
    }

    const result = await User.findByIdAndDelete(userId);
    if (!result) {
      throw new NotFoundError("User not found");
    }
  }
}
