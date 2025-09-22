#!/usr/bin/env bash
set -euo pipefail

# Usage: ./release.sh v1.2.4
# If no version given, a timestamp tag is generated: vYYYYMMDD-HHMMSS
VERSION="${1:-v$(date -u +%Y%m%d-%H%M%S)}"
REPO_SLUG="plicploc/jfdotcool"                      # ← change if needed
BRANCH_DEFAULT="main"
DIST_FILES=(
  "dist/app.latest.js"
  "dist/vendors/smooth.js"
)

echo "==> Release version: ${VERSION}"
echo "==> Repo: ${REPO_SLUG}"

# --- Pre-flight checks -------------------------------------------------------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: not inside a git repo"; exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "${CURRENT_BRANCH}" != "${BRANCH_DEFAULT}" ]]; then
  echo "Error: you are on '${CURRENT_BRANCH}', expected '${BRANCH_DEFAULT}'"; exit 1
fi

# Show ignored to help detect wrong .gitignore rules
echo "==> git status (including ignored)"
git status --ignored

# --- Add absolutely everything ----------------------------------------------
echo "==> git add -A"
git add -A

# If nothing to commit, continue; else commit.
if ! git diff --cached --quiet; then
  echo "==> git commit"
  git commit -m "chore: sync local project (full) before release ${VERSION}"
else
  echo "==> nothing new to commit before build"
fi

# --- Build -------------------------------------------------------------------
echo "==> npm ci (if package-lock exists)"
if [[ -f package-lock.json ]]; then npm ci; fi

echo "==> npm run build"
npm run build

# --- Include dist/* in git history (VERY IMPORTANT for jsDelivr) ------------
echo "==> add dist/*"
git add -A dist

if ! git diff --cached --quiet; then
  git commit -m "build: regenerate dist for ${VERSION}"
else
  echo "==> dist unchanged by build"
fi

# --- Push branch -------------------------------------------------------------
echo "==> git push origin ${BRANCH_DEFAULT}"
git push origin "${BRANCH_DEFAULT}"

# --- Create immutable tag at HEAD -------------------------------------------
echo "==> tagging ${VERSION}"
if git rev-parse "${VERSION}" >/dev/null 2>&1; then
  echo "Tag ${VERSION} already exists! Refusing to overwrite."
  echo "Use a new version or delete/retag explicitly if you *really* know what you're doing."
  exit 1
fi

git tag -a "${VERSION}" -m "release ${VERSION}"
git push origin "${VERSION}"

# --- Verify dist files exist -------------------------------------------------
for f in "${DIST_FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "Error: missing local file '$f'"; exit 1
  fi
done

# --- Purge jsDelivr cache ----------------------------------------------------
echo "==> Purging jsDelivr cache..."
for f in "${DIST_FILES[@]}"; do
  PURGE_URL="https://purge.jsdelivr.net/gh/${REPO_SLUG}@${VERSION}/${f}"
  echo "PURGE  $PURGE_URL"
  curl -fsSL "$PURGE_URL" >/dev/null || true
done

# --- CDN verification (checksum compare) ------------------------------------
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

echo "==> Verifying CDN bytes match local files..."
OK=1
for f in "${DIST_FILES[@]}"; do
  CDN_URL="https://cdn.jsdelivr.net/gh/${REPO_SLUG}@${VERSION}/${f}"
  OUT="${TMPDIR}/$(basename "$f")"
  echo "GET    $CDN_URL"
  curl -fsSL "$CDN_URL" -o "$OUT"

  # sha256 on mac (shasum) and linux (sha256sum) compatibility
  if command -v sha256sum >/dev/null 2>&1; then
    LHS="$(sha256sum "$f" | awk '{print $1}')"
    RHS="$(sha256sum "$OUT" | awk '{print $1}')"
  else
    LHS="$(shasum -a 256 "$f" | awk '{print $1}')"
    RHS="$(shasum -a 256 "$OUT" | awk '{print $1}')"
  fi

  if [[ "$LHS" != "$RHS" ]]; then
    echo "MISMATCH ❌  $f"
    echo " local: $LHS"
    echo " cdn  : $RHS"
    OK=0
  else
    echo "MATCH    ✅  $f"
  fi
done

if [[ $OK -eq 0 ]]; then
  echo "ERROR: CDN does not match local dist. Check build/tag/purge steps."
  exit 1
fi

echo ""
echo "✅ Release ${VERSION} is live and matches local dist."
echo "Use in HTML:"
for f in "${DIST_FILES[@]}"; do
  echo "<script src=\"https://cdn.jsdelivr.net/gh/${REPO_SLUG}@${VERSION}/${f}?v=$(date +%s)\" defer></script>"
done
