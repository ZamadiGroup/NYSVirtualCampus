import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import fs from 'fs';
import { connectDB } from "./mongodb";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Connect to MongoDB
  await connectDB();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Ensure uploads directory exists and serve it at /uploads
  try {
    const uploadsDir = path.resolve(import.meta.dirname, '..', 'attached_assets', 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });
    app.use('/uploads', express.static(uploadsDir));
  } catch (err) {
    log(`Failed to setup uploads static dir: ${err}`);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });

  // Handle server errors, especially EADDRINUSE
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${port} is already in use.`);
      console.error(`\n💡 To fix this issue, try one of the following:\n`);
      console.error(`   1. Find and stop the process using port ${port}:`);
      console.error(`      - On Windows: netstat -ano | findstr :${port}`);
      console.error(`                    taskkill /PID <PID> /F`);
      console.error(`      - On Mac/Linux: lsof -ti:${port} | xargs kill -9`);
      console.error(`                      or: npx kill-port ${port}`);
      console.error(`\n   2. Use a different port by setting the PORT environment variable:`);
      console.error(`      - On Windows: set PORT=3000 && npm run dev`);
      console.error(`      - On Mac/Linux: PORT=3000 npm run dev`);
      console.error(`      - Or add PORT=3000 to your .env file\n`);
      process.exit(1);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });
})();
