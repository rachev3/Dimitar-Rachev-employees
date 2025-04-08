import dotenv from "dotenv";
import path from "path";
import { Secret } from "jsonwebtoken";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function getEnvVariable(key: string, required = true): string {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value!;
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),

  JWT_SECRET: getEnvVariable("JWT_SECRET") as Secret,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || "1h",

  ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,

  MONGODB_URI: getEnvVariable("MONGODB_URI"),
};
