import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectDB } from "./mongodb";

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// API logging middleware (TypeScript-safe)
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const reqPath = req.path;

  let capturedJsonResponse: any = undefined;

  const originalResJson = res.json.bind(res) as Response["json"];

  res.json = ((body: any) => {
    capturedJsonResponse = body;
    return originalResJson(body);
  }) as Response["json"];

  res.on("finish", () => {
    const duration = Date.now() - start;

    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;

      if (capturedJsonResponse !== undefined) {
        try {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch {
          logLine += ` :: [unserializable json]`;
        }
      }

      if (logLine.length > 140) logLine = logLine.slice(0, 139) + "…";
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    log(`[Startup] cwd=${process.cwd()}`);
    log(`[Startup] NODE_ENV=${process.env.NODE_ENV || "undefined"}`);
    log(`[Startup] PORT=${process.env.PORT || "undefined"}`);

    // DB connect (never throws now)
    await connectDB();

    const server = await registerRoutes(app);

    // uploads (mount before SPA fallback)
    try {
      const uploadsDir = path.resolve(process.cwd(), "attached_assets", "uploads");
      fs.mkdirSync(uploadsDir, { recursive: true });
      app.use("/uploads", express.static(uploadsDir));
      log(`[Startup] uploads mounted at /uploads -> ${uploadsDir}`);
    } catch (err) {
      log(`[Startup] Failed to setup uploads static dir: ${err}`);
    }

    // Error handler (do NOT throw)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err?.status || err?.statusCode || 500;
      const message = err?.message || "Internal Server Error";
      log(`[Error] ${status} ${message}`);
      res.status(status).json({ message });
    });

    // Dev vs Prod by NODE_ENV only
    const nodeEnv = (process.env.NODE_ENV || "production").toLowerCase();
    const isDevelopment = nodeEnv === "development";

    if (isDevelopment) {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(port, "0.0.0.0", () => {
      log(`✅ serving on port ${port}`);
    });
  } catch (err) {
    console.error("❌ FATAL startup error:", err);
    process.exit(1);
  }
})();
