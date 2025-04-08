import "reflect-metadata";
import { createExpressServer, useContainer, Action } from "routing-controllers";
import { Container } from "typedi";
import express from "express";
import jwt from "jsonwebtoken";
import { ENV } from "./config/env";
import { AuthController } from "./controllers/AuthController";
import { ErrorMiddleware } from "./middlewares/ErrorMiddleware";
import { UserPayload } from "./types/UserPayload";
import { AuthorizationError } from "./utils/errors";

useContainer(Container);

export const createApp = () => {
  const app = createExpressServer({
    cors: true,
    routePrefix: "/api",
    controllers: [AuthController],
    middlewares: [ErrorMiddleware],
    defaultErrorHandler: false,
    authorizationChecker: async (action: Action, roles: string[] = []) => {
      try {
        const token = action.request.headers["authorization"]?.split(" ")[1];
        if (!token) {
          throw new AuthorizationError("No token provided");
        }

        // Verify token
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as UserPayload;

        // Add user to request
        action.request.user = decoded;

        // Check if user has required role
        if (roles.length > 0 && !roles.includes(decoded.role)) {
          throw new AuthorizationError("Insufficient permissions");
        }

        return true;
      } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
          throw new AuthorizationError("Invalid token");
        }
        if (error instanceof jwt.TokenExpiredError) {
          throw new AuthorizationError("Token expired");
        }
        throw error;
      }
    },
    currentUserChecker: (action: Action) => {
      return action.request.user;
    },
  });

  // Apply middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  return app;
};
