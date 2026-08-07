#!/usr/bin/env bash

# Quick checks before going live. Run on the server from repo root:

#   bash deploy/preflight.sh

#

# Production layout: public_html/ + backend/ siblings under /var/www/wearencc.org



set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"



echo "== NCC production preflight =="



fail=0



if [ -s "$HOME/.nvm/nvm.sh" ]; then

  # shellcheck disable=SC1091

  . "$HOME/.nvm/nvm.sh"

fi



if ! command -v node >/dev/null 2>&1; then

  echo "[FAIL] node not installed (use NVM — see docs/production-runtime.md)"

  fail=1

else

  echo "[OK] node $(node -v) at $(command -v node)"

fi



if command -v apache2 >/dev/null 2>&1; then

  echo "[OK] apache2 present (shared-server deploy)"

elif command -v nginx >/dev/null 2>&1; then

  echo "[OK] nginx present"

else

  echo "[WARN] neither apache2 nor nginx found — install Apache per deploy-ubuntu-wearencc.md"

fi



RUNTIME_JSON=""

if [ -f "public_html/assets/config/runtime.json" ]; then

  RUNTIME_JSON="public_html/assets/config/runtime.json"

elif [ -f "assets/config/runtime.json" ]; then

  RUNTIME_JSON="assets/config/runtime.json"

fi

if [ -z "$RUNTIME_JSON" ]; then

  echo "[FAIL] missing runtime.json (copy to public_html/assets/config/ or assets/config/)"

  fail=1

else

  echo "[OK] $RUNTIME_JSON exists"

fi



EVENTS_XML=""

if [ -f "public_html/assets/data/events.xml" ]; then

  EVENTS_XML="public_html/assets/data/events.xml"

elif [ -f "assets/data/events.xml" ]; then

  EVENTS_XML="assets/data/events.xml"

fi

if [ -z "$EVENTS_XML" ]; then

  echo "[FAIL] missing events.xml (required for status probe)"

  fail=1

elif [ ! -s "$EVENTS_XML" ]; then

  echo "[FAIL] events.xml is empty"

  fail=1

else

  echo "[OK] $EVENTS_XML ($(wc -c < "$EVENTS_XML") bytes)"

fi



if [ ! -f "backend/.env" ]; then

  echo "[FAIL] missing backend/.env (copy from backend/.env.example)"

  fail=1

else

  echo "[OK] backend/.env exists"

fi



if [ ! -d "backend/node_modules" ]; then

  echo "[WARN] run: source ~/.nvm/nvm.sh && cd backend && npm install --omit=dev"

fi



for dir in backend/data backend/uploads; do

  if [ ! -d "$dir" ]; then

    echo "[WARN] missing $dir — create and make writable by Node user"

  fi

done



if command -v curl >/dev/null 2>&1; then

  if curl -sf http://127.0.0.1:4000/api/health >/dev/null 2>&1; then

    echo "[OK] backend health http://127.0.0.1:4000/api/health"

  else

    echo "[WARN] backend not responding on 127.0.0.1:4000 (start PM2 first)"

  fi

  if curl -sf http://127.0.0.1:4000/api/public/status >/dev/null 2>&1; then

    echo "[OK] backend public status http://127.0.0.1:4000/api/public/status"

  else

    echo "[WARN] public status endpoint not responding"

  fi

fi



if [ "$fail" -eq 0 ]; then

  echo "Preflight passed (warnings may still apply)."

else

  echo "Preflight failed — fix items above."

  exit 1

fi

