import { Service } from "typedi";
import { User, IUser } from "../models/User";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ENV } from "../config/env";
import {
  AuthenticationError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../utils/errors";
import { RegisterDto, LoginDto, UpdateUserDto } from "../dtos/AuthDto";

@Service()
export class AuthService {
  async register(
    input: RegisterDto,
    role: "admin" | "user" = "user"
  ): Promise<IUser> {
    const existingUser = await User.findOne({ username: input.username });
    if (existingUser) {
      throw new ConflictError(
        "User already exists",
        "username",
        input.username
      );
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

  async login(input: LoginDto): Promise<{ token: string; user: IUser }> {
    const user = await User.findOne({ username: input.username });
    if (!user) {
      throw new AuthenticationError("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw new AuthenticationError("Invalid credentials");
    }

    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(
      payload,
      ENV.JWT_SECRET as string,
      { expiresIn: ENV.JWT_EXPIRATION } as SignOptions
    );

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
      throw new NotFoundError("User not found", "userId");
    }
    return user;
  }

  async updateUser(userId: string, input: UpdateUserDto): Promise<IUser> {
    if (!userId || typeof userId !== "string") {
      throw new ValidationError("Valid user ID is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found", "userId");
    }

    if (input.username) {
      const existingUser = await User.findOne({ username: input.username });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError(
          "Username already taken",
          "username",
          input.username
        );
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
      throw new NotFoundError("User not found", "userId");
    }
  }
}
