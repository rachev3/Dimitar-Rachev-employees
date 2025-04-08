import "dotenv/config";
import { createApp } from "./app";
import { connectDB } from "./config/db";
import { seedAdminUser } from "./seed/adminSeed";
import { ENV } from "./config/env";

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...", error);
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDB();

    await seedAdminUser();

    const app = createApp();

    const PORT = ENV.PORT;
    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    process.on("unhandledRejection", (error) => {
      console.error("UNHANDLED REJECTION! Shutting down...", error);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
