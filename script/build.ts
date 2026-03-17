import { build as esbuild } from "esbuild";
import { rm, readFile } from "fs/promises";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Node.js built-in modules to externalize
const nodeBuiltins = [
  "node:events",
  "node:path",
  "node:url",
  "node:fs",
  "node:fs/promises",
  "node:http",
  "node:https",
  "node:querystring",
  "node:crypto",
  "node:stream",
  "node:util",
  "node:os",
  "node:buffer",
  "node:net",
  "node:tls",
  "node:zlib",
  "node:assert",
  "node:console",
  "node:process",
  "node:child_process",
  "node:cluster",
  "node:dgram",
  "node:dns",
  "node:domain",
  "node:module",
  "node:readline",
  "node:repl",
  "node:sys",
  "node:tty",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  // Run vite build from client directory
  execSync("npx vite build", {
    cwd: path.resolve(__dirname, "..", "client"),
    stdio: "inherit",
  });

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = [...nodeBuiltins, ...allDeps];

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "esm",
    outfile: "dist/index.js",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: false,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
