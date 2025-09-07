import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from "fs";
import { join } from "path";

// Version depuis package.json
const version = JSON.parse(readFileSync("package.json", "utf8")).version;

// Prépare le dossier de sortie
const OUTDIR = "dist";
mkdirSync(OUTDIR, { recursive: true });

// Bandeau d’en-tête
const banner = `/* JF Webflow App v${version} | build: ${new Date().toISOString()} */`;

// Build principal
await build({
  entryPoints: ["src/index.js"],
  bundle: true,
  format: "iife",
  sourcemap: false,
  target: ["es2017"],
  outfile: join(OUTDIR, `app.v${version}.js`),
  banner: { js: banner },
  minify: process.argv.includes("--minify"),
});

// Duplique le bundle en "latest"
const latest = readFileSync(join(OUTDIR, `app.v${version}.js`), "utf8");
writeFileSync(join(OUTDIR, "app.latest.js"), latest);

// Copie tout le dossier "static" → "dist"
try {
  if (existsSync("static")) {
    cpSync("static", OUTDIR, { recursive: true });
    console.log("[build] static → dist OK");
  } else {
    console.log("[build] (pas de dossier static/, skip copy)");
  }
} catch (e) {
  console.warn("[build] copy static failed", e);
}

console.log(`Built v${version}`);
