import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { registerRoutes } from "../server/routes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Register routes only once
let routesRegistered = false;

async function ensureReady() {
  // Always reconnect MongoDB if disconnected
  if (process.env.MONGODB_URI && mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
    } catch (err) {
      console.error("MongoDB connection failed:", (err as Error).message);
    }
  }

  // Register routes only once
  if (!routesRegistered) {
    await registerRoutes(app);
    routesRegistered = true;
  }
}

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("API Error:", err);
  res.status(err?.status || 500).json({ error: err?.message || "Internal Server Error" });
});

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  await ensureReady();
  return app(req, res);
}
