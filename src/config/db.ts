import mongoose from "mongoose";
import { Container } from "typedi";
import { ENV } from "./env";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log("MongoDB Connected Successfully");

    Container.set("mongoose", mongoose);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
