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
import { UserPayload } from "../types/UserPayload";

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
  async register(@Body() body: any) {
    const user = await this.authService.register(body);
    return {
      success: true,
      user: this.formatUserResponse(user),
    };
  }

  @Post("/login")
  async login(@Body() body: any) {
    const { token, user } = await this.authService.login(body);
    return {
      success: true,
      token,
      user: this.formatUserResponse(user),
    };
  }

  @Get("/users")
  @Authorized(["admin"])
  async getUsers() {
    const users = await this.authService.getUsers();
    return {
      success: true,
      users: users.map((user) => this.formatUserResponse(user)),
    };
  }

  @Get("/users/:id")
  @Authorized(["admin"])
  async getUserById(@Param("id") id: string) {
    const user = await this.authService.getUserById(id);
    return {
      success: true,
      user: this.formatUserResponse(user),
    };
  }

  @Put("/users/:id")
  @Authorized()
  async updateUser(
    @Param("id") id: string,
    @Body() body: any,
    @CurrentUser() currentUser: UserPayload
  ) {
    if (currentUser.role !== "admin" && currentUser.id !== id) {
      return {
        success: false,
        message: "Unauthorized: You can only update your own account",
      };
    }

    const user = await this.authService.updateUser(id, body);
    return {
      success: true,
      user: this.formatUserResponse(user),
    };
  }

  @Delete("/users/:id")
  @Authorized(["admin"])
  async deleteUser(@Param("id") id: string) {
    await this.authService.deleteUser(id);
    return {
      success: true,
      message: "User deleted successfully",
    };
  }
}
