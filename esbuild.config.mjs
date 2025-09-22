import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

// 1) Version prioritaire via env (RELEASE_VERSION), sinon package.json
const pkgVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
const version = (process.env.RELEASE_VERSION || pkgVersion).replace(/^v/i, "");

// (optionnel) utile pour debug
let gitShort = "";
try { gitShort = execSync("git rev-parse --short HEAD").toString().trim(); } catch {}

// 2) Prépare dist
const OUTDIR = "dist";
mkdirSync(OUTDIR, { recursive: true });

// 3) Bandeau
const banner = `/* JF Webflow App v${version} | build: ${new Date().toISOString()}${gitShort ? " | commit: "+gitShort : ""} */`;

// 4) Build principal
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

// 5) Duplique en latest
const latest = readFileSync(join(OUTDIR, `app.v${version}.js`), "utf8");
writeFileSync(join(OUTDIR, "app.latest.js"), latest);

// 6) Copie static → dist (inchangé)
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
