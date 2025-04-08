import { Container } from "typedi";
import { User } from "../models/User";
import { AuthService } from "../services/AuthService";
import { ENV } from "../config/env";

export const seedAdminUser = async (): Promise<void> => {
  try {
    const adminExists = await User.exists({ role: "admin" });

    if (!adminExists) {
      const adminUsername = ENV.ADMIN_USERNAME || "admin";
      const adminPassword = ENV.ADMIN_PASSWORD;

      if (!adminPassword) {
        console.warn("ADMIN_PASSWORD not set. Skipping admin user creation.");
        return;
      }

      const authService = Container.get(AuthService);

      await authService.register(
        {
          username: adminUsername,
          password: adminPassword,
        },
        "admin"
      );
      console.log("Admin user created successfully!");
    } else {
      console.log("Admin user already exists, skipping creation.");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
};
