import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import { pathToFileURL } from 'url';
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

  // Dynamically import vite config only when running setupVite (development mode).
  // This prevents bundlers from trying to statically resolve/execute dev-only config
  // (which can include top-level await or ESM-only constructs).
  let viteConfig: any = {};
  try {
    // Build a runtime path to vite.config so bundlers won't statically resolve it during server bundling.
    const cfgPath = path.resolve(import.meta.dirname, '..', 'vite.config');
    viteConfig = (await import(pathToFileURL(cfgPath).href))?.default || {};
  } catch (e) {
    // If import fails, fall back to empty config — setupVite is development-only.
    viteLogger.warn("Could not import vite.config dynamically; continuing with defaults.", e as any);
    viteConfig = {};
  }

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
  // For Vercel deployment, static files are served from the root dist directory
  const distPath = path.resolve(import.meta.dirname, "..", "dist");
  const publicPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  // Check both possible locations for static files
  const staticPath = fs.existsSync(publicPath) ? publicPath : distPath;

  if (!fs.existsSync(staticPath)) {
    throw new Error(
      `Could not find the build directory: ${staticPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(staticPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    try {
      const indexPath = path.resolve(staticPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error(`Index file not found at: ${indexPath}`);
        res.status(404).send("Application not found. Please check the build output.");
      }
    } catch (error) {
      console.error("Error serving static files:", error);
      res.status(500).send("Internal server error");
    }
  });
}
