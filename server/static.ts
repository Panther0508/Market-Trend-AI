import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_PATH = path.resolve(__dirname, "..", "dist", "public");
const INDEX_PATH = path.resolve(__dirname, "..", "dist", "public", "index.html");

export function serveStatic(app: Express) {
  if (!fs.existsSync(DIST_PATH)) {
    throw new Error(
      `Could not find the build directory: ${DIST_PATH}, make sure to build the client first`,
    );
  }

  app.use(express.static(DIST_PATH));

  // fall through to index.html if the file doesn't exist
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(INDEX_PATH);
  });
}
