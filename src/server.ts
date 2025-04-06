import "reflect-metadata"; // Required for routing-controllers
import express from "express";

const app = express();

// Define a simple route for testing
app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Hello, World!");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
