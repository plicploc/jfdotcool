// scripts/build.mjs
import { build } from "esbuild";
import fs from "node:fs";
import { execSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const MINIFY = args.has("--minify"); // ← lit le flag CLI

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
const hash = execSync("git rev-parse --short HEAD").toString().trim();
const date = new Date().toISOString();
const banner = `/* JF Webflow App v${pkg.version} | build: ${date} | commit: ${hash} */`;

await build({
  entryPoints: ["src/core/app.js"],
  bundle: true,
  minify: MINIFY,                 // ← le flag contrôle la minif
  outfile: "dist/jf-webflow-app.min.js",
  banner: { js: banner }
});
console.log(banner);
