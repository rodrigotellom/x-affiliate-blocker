#!/usr/bin/env bash
#
# Builds the Chrome Web Store upload zip into dist/. Ships only the files the
# manifest loads; docs, store copy and git metadata stay out.
#
# Usage: ./scripts/build-zip.sh
set -euo pipefail
cd "$(dirname "$0")/.."

NAME="x-affiliate-blocker"
VERSION="$(node -p "require('./manifest.json').version")"
OUT="dist/${NAME}-${VERSION}.zip"

echo "==> Verifying manifest references resolve"
node -e '
const m = require("./manifest.json");
const fs = require("fs");
const paths = [
  ...m.content_scripts.flatMap((cs) => [...(cs.js || []), ...(cs.css || [])]),
  ...Object.values(m.icons || {}),
  ...Object.values(m.action?.default_icon || {}),
  ...(m.action?.default_popup ? [m.action.default_popup] : []),
];
const missing = paths.filter((p) => !fs.existsSync(p));
if (missing.length) { console.error("Missing files referenced by manifest.json:", missing); process.exit(1); }
console.log(`    ${paths.length} referenced paths, all present`);
'

echo "==> Syntax-checking scripts"
for f in *.js; do node --check "$f"; done

echo "==> Packaging ${OUT}"
rm -rf dist && mkdir -p dist
zip -q -X "$OUT" manifest.json inject.js content.js popup.html popup.js icons/*.png

echo "==> Contents"
unzip -Z1 "$OUT" | sed 's/^/    /'
echo "==> Built $OUT ($(du -h "$OUT" | cut -f1))"
