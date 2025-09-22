#!/usr/bin/env bash
set -euo pipefail

echo "▶ Sync & build"
git add -A
git commit -m "chore: sync before build" || true
npm ci --silent || true
npm run build

echo "▶ Commit dist"
git add -A dist
git commit -m "build: dist (deploy main)" || true

echo "▶ Push main"
git push origin main

echo "▶ Purge jsDelivr cache"
curl -fsSL "https://purge.jsdelivr.net/gh/plicploc/jfdotcool@main/dist/app.latest.js" >/dev/null || true
curl -fsSL "https://purge.jsdelivr.net/gh/plicploc/jfdotcool@main/dist/smooth.js" >/dev/null || true

echo "▶ Quick check (shows first line)"
curl -fsSL "https://cdn.jsdelivr.net/gh/plicploc/jfdotcool@main/dist/app.latest.js?v=$(date +%s)" | head -n1
