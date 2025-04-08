import { Express } from "express";
import { UserPayload } from "./UserPayload";

declare global {
  namespace Express {
    interface User extends UserPayload {}

    interface Request {
      user?: User;
    }
  }
}

export {};
