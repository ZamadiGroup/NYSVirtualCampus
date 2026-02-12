// server/vite.ts (FIXED)

import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Dev SPA fallback via Vite
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(import.meta.dirname, "..", "client", "index.html");

      // always reload index.html from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // 🔒 LOCKED to your Vite build output folder: dist/public
  // Using import.meta.dirname is more stable than process.cwd() on platforms like Render.
  const publicPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  const indexPath = path.join(publicPath, "index.html");

  log(`[serveStatic] Checking for build at: ${publicPath}`);

  if (!fs.existsSync(publicPath)) {
    const errorMsg =
      `Build directory not found: ${publicPath}\n` +
      `Please run "npm run build" before starting in production.`;
    log(`[serveStatic] ERROR: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (!fs.existsSync(indexPath)) {
    const errorMsg =
      `index.html not found in: ${indexPath}\n` +
      `Your build may be incomplete. Please run "npm run build" again.`;
    log(`[serveStatic] ERROR: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  log(`[serveStatic] Serving static files from: ${publicPath}`);

  // Serve assets
  app.use(express.static(publicPath));

  // SPA fallback: do not intercept API/uploads routes
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(indexPath);
  });
}
