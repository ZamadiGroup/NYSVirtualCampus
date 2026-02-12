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
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
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
  const publicPath = path.resolve(process.cwd(), "dist", "public");
  const indexPath = path.join(publicPath, "index.html");

  log(`[serveStatic] Checking for build at: ${publicPath}`);

  if (!fs.existsSync(publicPath)) {
    const errorMsg = `Build directory not found: ${publicPath}\n` +
      `Please run "npm run build" before starting in production.`;
    log(`[serveStatic] ERROR: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (!fs.existsSync(indexPath)) {
    const errorMsg = `index.html not found in: ${indexPath}\n` +
      `Your build may be incomplete. Please run "npm run build" again.`;
    log(`[serveStatic] ERROR: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  log(`[serveStatic] Serving static files from: ${publicPath}`);
  app.use(express.static(publicPath));

  // SPA fallback: serve index.html for all unmatched routes
  // This ensures client-side routing works correctly
  app.get("*", (_req, res, next) => {
    // Don't intercept API routes
    if (_req.path.startsWith("/api") || _req.path.startsWith("/uploads")) {
      return next();
    }

    try {
      res.sendFile(indexPath);
    } catch (error) {
      log(`[serveStatic] Error serving index.html: ${error}`);
      res.status(500).send("Application error");
    }
  });
}
