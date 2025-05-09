import "reflect-metadata";
import { createExpressServer, useContainer, Action } from "routing-controllers";
import { Container } from "typedi";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "./config/env";
import { AuthController } from "./controllers/AuthController";
import { ProjectController } from "./controllers/ProjectController";
import { CollaborationController } from "./controllers/CollaborationController";
import { ErrorMiddleware } from "./middlewares/ErrorMiddleware";
import { RequestLoggerMiddleware } from "./middlewares/RequestLogger";
import { RateLimiterMiddleware } from "./middlewares/RateLimiter";
import { UserPayload } from "./types/UserPayload";
import { AuthorizationError } from "./utils/errors";

useContainer(Container);

export const createApp = () => {
  const app = createExpressServer({
    cors: true,
    routePrefix: "/api",
    controllers: [AuthController, ProjectController, CollaborationController],
    middlewares: [
      RequestLoggerMiddleware,
      RateLimiterMiddleware,
      ErrorMiddleware,
    ],
    defaultErrorHandler: false,
    validation: {
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: {
        target: false,
        value: false,
      },
    },
    classTransformer: true,
    authorizationChecker: async (action: Action, roles: string[] = []) => {
      try {
        const token = action.request.headers["authorization"]?.split(" ")[1];
        if (!token) {
          throw new AuthorizationError("No token provided");
        }

        const decoded = jwt.verify(token, ENV.JWT_SECRET) as UserPayload;

        action.request.user = decoded;

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

  app.use(
    express.json({
      limit: "10kb",
    })
  );
  app.use(
    express.urlencoded({
      extended: true,
      limit: "10kb",
    })
  );

  app.get("/health", (_: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  return app;
};
