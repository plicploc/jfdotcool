import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const version = JSON.parse(readFileSync("package.json", "utf8")).version;
mkdirSync("dist", { recursive: true });

const banner = `/* JF Webflow App v${version} | build: ${new Date().toISOString()} */`;

await build({
  entryPoints: ["src/index.js"],
  bundle: true,
  format: "iife",
  sourcemap: false,
  target: ["es2017"],
  outfile: `dist/app.v${version}.js`,
  banner: { js: banner },
  minify: process.argv.includes("--minify")
});

const latest = readFileSync(`dist/app.v${version}.js`, "utf8");
writeFileSync("dist/app.latest.js", latest);
console.log(`Built v${version}`);
