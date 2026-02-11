import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import fs from 'fs';
import { connectDB } from "./mongodb";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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
  
  // Determine if we're in development or production
  // Development: source files exist (client/index.html)
  // Production: only built files exist (dist/public)
  const clientSourcePath = path.resolve(process.cwd(), "client", "index.html");
  const distPublicPath = path.resolve(process.cwd(), "dist", "public");
  const hasClientSource = fs.existsSync(clientSourcePath);
  const hasDistPublic = fs.existsSync(distPublicPath);
  
  log(`[Startup] Environment: cwd=${process.cwd()}`);
  log(`[Startup] Source files: client/index.html=${hasClientSource}`);
  log(`[Startup] Built files: dist/public=${hasDistPublic}`);
  
  // Only use development mode if source files exist
  // Production mode requires built files to exist
  const isDevelopment = hasClientSource;
  
  if (isDevelopment && !hasDistPublic) {
    log(`[Startup] Development mode - Vite will compile on-demand`);
  } else if (!isDevelopment && hasDistPublic) {
    log(`[Startup] Production mode - Serving pre-built static files`);
  } else if (!isDevelopment && !hasDistPublic) {
    throw new Error(
      `FATAL: No build found at ${distPublicPath}.\n` +
      `Production deployment requires running "npm run build" first.\n` +
      `This should be done automatically in your build step, but please verify.`
    );
  }

  try {
    if (isDevelopment) {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
  } catch (err) {
    log(`[Startup] FATAL ERROR during setup: ${err}`);
    throw err;
  }

  // Ensure uploads directory exists and serve it at /uploads
  try {
    const uploadsDir = path.resolve(process.cwd(), 'attached_assets', 'uploads');
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
})();
