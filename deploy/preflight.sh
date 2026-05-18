#!/usr/bin/env bash
# Quick checks before going live. Run on the server from repo root:
#   bash deploy/preflight.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== NCC production preflight =="

fail=0

if ! command -v node >/dev/null 2>&1; then
  echo "[FAIL] node not installed"
  fail=1
else
  echo "[OK] node $(node -v)"
fi

if [ ! -f "assets/config/runtime.json" ]; then
  echo "[FAIL] missing assets/config/runtime.json (copy from runtime.production.example.json)"
  fail=1
else
  echo "[OK] runtime.json exists"
fi

if [ ! -f "backend/.env" ]; then
  echo "[FAIL] missing backend/.env (copy from backend/.env.example)"
  fail=1
else
  echo "[OK] backend/.env exists"
fi

if [ ! -d "backend/node_modules" ]; then
  echo "[WARN] run: cd backend && npm install --omit=dev"
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
    echo "[WARN] backend not responding on 127.0.0.1:4000 (start PM2/systemd first)"
  fi
fi

if [ "$fail" -eq 0 ]; then
  echo "Preflight passed (warnings may still apply)."
else
  echo "Preflight failed — fix items above."
  exit 1
fi
