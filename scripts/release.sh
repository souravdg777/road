#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: release.sh <patch|minor|major> \"<summary>\""
  exit 1
}

[[ $# -lt 2 ]] && usage

BUMP=$1
SUMMARY=$2
APP_JSON="app.json"
CHANGELOG="CHANGELOG.md"

if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Error: bump type must be patch, minor, or major" >&2
  exit 1
fi

# Read current version
CURRENT=$(node -e "console.log(require('./${APP_JSON}').expo.version)")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

# Bump
case "$BUMP" in
  patch) PATCH=$((PATCH + 1)) ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
TODAY=$(date +%Y-%m-%d)

echo "Bumping $CURRENT → $NEW_VERSION"

# Write new version to app.json
node -e "
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('${APP_JSON}', 'utf8'));
cfg.expo.version = '${NEW_VERSION}';
fs.writeFileSync('${APP_JSON}', JSON.stringify(cfg, null, 2) + '\n');
"

# Prepend to CHANGELOG.md
ENTRY="## v${NEW_VERSION} — ${TODAY}\n${SUMMARY}\n"
if [[ -f "$CHANGELOG" ]]; then
  EXISTING=$(cat "$CHANGELOG")
  printf "%b\n%s" "$ENTRY" "$EXISTING" > "$CHANGELOG"
else
  printf "%b" "$ENTRY" > "$CHANGELOG"
fi

# Commit
git add "$APP_JSON" "$CHANGELOG"
git commit -m "chore: release v${NEW_VERSION}"

# Tag
git tag -a "v${NEW_VERSION}" -m "v${NEW_VERSION}"

# Push
git push origin main
git push origin "v${NEW_VERSION}"

echo "Released v${NEW_VERSION} and pushed tag."
