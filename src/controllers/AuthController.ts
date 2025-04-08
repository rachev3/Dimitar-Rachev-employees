import {
  JsonController,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Authorized,
  CurrentUser,
} from "routing-controllers";
import { Service } from "typedi";
import { AuthService } from "../services/AuthService";
import type { UserPayload } from "../types/UserPayload";
import { RegisterDto, LoginDto, UpdateUserDto } from "../dtos/AuthDto";
import { NotFoundError } from "../utils/errors";

@JsonController("/auth")
@Service()
export class AuthController {
  constructor(private authService: AuthService) {}

  private formatUserResponse(user: any) {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Post("/register")
  async register(@Body() body: RegisterDto) {
    try {
      const user = await this.authService.register(body);
      return {
        success: true,
        user: this.formatUserResponse(user),
      };
    } catch (error) {
      throw error;
    }
  }

  @Post("/login")
  async login(@Body() body: LoginDto) {
    try {
      const { token, user } = await this.authService.login(body);
      return {
        success: true,
        token,
        user: this.formatUserResponse(user),
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("/users")
  @Authorized(["admin"])
  async getUsers() {
    try {
      const users = await this.authService.getUsers();
      return {
        success: true,
        users: users.map((user) => this.formatUserResponse(user)),
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("/users/:id")
  @Authorized(["admin"])
  async getUserById(@Param("id") id: string) {
    try {
      const user = await this.authService.getUserById(id);
      return {
        success: true,
        user: this.formatUserResponse(user),
      };
    } catch (error) {
      throw error;
    }
  }

  @Put("/users/:id")
  @Authorized()
  async updateUser(
    @Param("id") id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: UserPayload
  ) {
    try {
      if (currentUser.role !== "admin" && currentUser.id !== id) {
        throw new NotFoundError("User not found");
      }

      const user = await this.authService.updateUser(id, body);
      return {
        success: true,
        user: this.formatUserResponse(user),
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete("/users/:id")
  @Authorized(["admin"])
  async deleteUser(@Param("id") id: string) {
    try {
      await this.authService.deleteUser(id);
      return {
        success: true,
        message: "User deleted successfully",
      };
    } catch (error) {
      throw error;
    }
  }
}
