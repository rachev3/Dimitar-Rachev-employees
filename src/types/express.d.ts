// Extend Express Request interface to include user property
import { Express } from "express";
import { UserPayload } from "./UserPayload";

declare global {
  namespace Express {
    // Use the imported UserPayload as the User interface
    interface User extends UserPayload {}

    interface Request {
      user?: User;
    }
  }
}

export {};
