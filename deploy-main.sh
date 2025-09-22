# 0) Être sur main et à jour
git checkout main
git pull --rebase

# 1) Committer tout ce que tu as en local (src, etc.)
git add -A
git commit -m "chore: sync before v1.3.0" || true

# 2) Rebuild dist minifié (adapte si besoin)
npm ci --silent || true
npm run build

# 3) Inclure le dist dans Git (INDISPENSABLE pour jsDelivr)
git add -A dist
git commit -m "build: dist for v1.3.0" || true

# 4) Push sur main
git push origin main

# 5) Créer le tag v1.3.0 sur le dernier commit et le pousser
git tag -a v1.3.0 -m "release v1.3.0"
git push origin v1.3.0

# 6) Purger jsDelivr pour forcer la prise en compte
curl -fsSL "https://purge.jsdelivr.net/gh/plicploc/jfdotcool@v1.3.0/dist/app.latest.js" >/dev/null
# (si tu publies aussi smooth séparé)
curl -fsSL "https://purge.jsdelivr.net/gh/plicploc/jfdotcool@v1.3.0/dist/smooth.js" >/dev/null || true
