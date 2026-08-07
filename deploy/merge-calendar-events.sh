#!/usr/bin/env bash
# Merge new bulletin events into existing events.xml (both server paths) and import into API.
# Does NOT delete existing events in backend/data/events.json — import merges by event id.
#
# Usage on server:
#   cd /var/www/wearencc.org
#   bash deploy/merge-calendar-events.sh deploy/events-additions-053126.xml
#
# Or after uploading additions to /tmp:
#   bash deploy/merge-calendar-events.sh /tmp/events-additions-053126.xml

set -euo pipefail

NCC_ROOT="${NCC_ROOT:-/var/www/wearencc.org}"
ADD_FILE="${1:-$NCC_ROOT/deploy/events-additions-053126.xml}"

if [ ! -f "$ADD_FILE" ]; then
  echo "Missing additions file: $ADD_FILE"
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
XML_TARGETS=(
  "$NCC_ROOT/public_html/assets/data/events.xml"
  "$NCC_ROOT/assets/data/events.xml"
)

merge_into_xml() {
  local target="$1"
  local dir
  dir="$(dirname "$target")"
  mkdir -p "$dir"

  if [ ! -f "$target" ]; then
    echo "Creating new $target"
    {
      echo '<?xml version="1.0" encoding="UTF-8"?>'
      echo '<events version="1">'
      cat "$ADD_FILE"
      echo '</events>'
    } > "$target"
    return
  fi

  cp "$target" "${target}.bak-${STAMP}"

  if grep -q '</events>' "$target"; then
    awk -v addfile="$ADD_FILE" '
      /<\/events>/ {
        while ((getline line < addfile) > 0) print line
        close(addfile)
      }
      { print }
    ' "$target" > "${target}.new"
    mv "${target}.new" "$target"
    echo "Merged additions into $target (backup: ${target}.bak-${STAMP})"
  elif grep -q '</calendar>' "$target"; then
    echo "[WARN] $target uses <calendar> format — appending before </calendar> is not supported."
    echo "       Replace with <events version=\"1\"> or upload assets/data/events.xml from repo."
    exit 1
  else
    echo "[WARN] Unknown XML format in $target — skipped merge."
    exit 1
  fi
}

echo "== NCC calendar merge =="
echo "Additions: $ADD_FILE"
echo "Root:      $NCC_ROOT"
echo ""

for target in "${XML_TARGETS[@]}"; do
  merge_into_xml "$target"
done

if [ -f "$NCC_ROOT/backend/data/events.json" ]; then
  cp "$NCC_ROOT/backend/data/events.json" "$NCC_ROOT/backend/data/events.json.bak-${STAMP}"
  echo "Backed up backend/data/events.json"
fi

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
fi

cd "$NCC_ROOT/backend"
npm run import-events-xml

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart ncc-backend
  echo ""
  echo "PM2 restarted ncc-backend"
fi

echo ""
echo "Done. Verify:"
echo "  curl -s http://127.0.0.1:4000/api/events | head -c 400"
echo "  curl -s http://127.0.0.1:4000/api/health"
echo "  https://wearencc.org/events.html"
