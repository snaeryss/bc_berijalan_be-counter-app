import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import routes from "./routes";
import { MErrorHandler } from "./middlewares/error.middleware";
import { connectRedis } from "./config/redis.config";
import { initializeCronJobs, stopAllCronJobs } from "./config/cron.config";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(routes);

app.use(MErrorHandler);

const prisma = new PrismaClient();

const startServer = async () => {
  try {
    await connectRedis();

    await prisma.$connect();
    console.log("Database connected successfully");

    initializeCronJobs();
    console.log("Cron jobs initialized successfully");

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");

  stopAllCronJobs();

  await prisma.$disconnect();
  console.log("Server shut down complete");

  process.exit(0);
});

startServer();
