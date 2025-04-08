import "dotenv/config";
import { createApp } from "./app";
import { connectDB } from "./config/db";
import { seedAdminUser } from "./seed/adminSeed";
import { ENV } from "./config/env";

const startServer = async () => {
  try {
    await connectDB();

    // Run seed functions
    await seedAdminUser();

    const app = createApp();

    const PORT = ENV.PORT;
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
