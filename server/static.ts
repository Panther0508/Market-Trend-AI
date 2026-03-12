import express, { type Express } from "express";
import fs from "fs";
import path from "path";

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
  app.use("/*", (_req, res) => {
    res.sendFile(INDEX_PATH);
  });
}
