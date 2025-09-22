#!/usr/bin/env bash
set -euo pipefail

# Usage: ./deploy-main.sh 1.3.1
VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
  echo "❌ Merci de préciser une version (ex: ./deploy-main.sh 1.3.1)"
  exit 1
fi
TAG="v${VERSION}"

echo "▶ Deploy JF Webflow App ${TAG}"

# 0) Être sur main et à jour
git checkout main
git pull --rebase

# 1) Committer tout ce que tu as en local
git add -A
git commit -m "chore: sync before ${TAG}" || true

# 2) Rebuild dist avec version forcée
RELEASE_VERSION="${VERSION}" npm ci --silent || true
RELEASE_VERSION="${VERSION}" npm run build

# 3) Inclure le dist dans Git
git add -A dist
git commit -m "build: dist for ${TAG}" || true

# 4) Push sur main
git push origin main

# 5) Créer le tag et le pousser
git tag -a "${TAG}" -m "release ${TAG}" || true
git push origin "${TAG}"

# 6) Purger jsDelivr pour latest et smooth
curl -fsSL "https://purge.jsdelivr.net/gh/plicploc/jfdotcool@${TAG}/dist/app.latest.js" >/dev/null
curl -fsSL "https://purge.jsdelivr.net/gh/plicploc/jfdotcool@${TAG}/dist/smooth.js" >/dev/null || true

# 7) Vérif rapide (première ligne CDN)
echo "▶ Vérification CDN..."
curl -fsSL "https://cdn.jsdelivr.net/gh/plicploc/jfdotcool@${TAG}/dist/app.latest.js?v=$(date +%s)" | head -n1

echo "✅ Deploy ${TAG} terminé."
