# Production runtime reference (wearencc.org)

This document records the **actual production environment** after the May 2026 system overhaul. Use it when reproducing deploys, debugging server issues, or onboarding another operator.

**Live site:** https://wearencc.org/

---

## Server snapshot

| Item | Value |
|------|--------|
| VM | `instance-20260502-213133` |
| Public IP | `34.30.208.144` |
| OS | Ubuntu **18.04** (Bionic) — GLIBC **2.27** system baseline |
| Web server | Apache **2.4.29** (ports 80 / 443) |
| TLS | Certbot + Apache — one cert for NCC + Pinnacle hostnames |
| Node runtime | **v24.16.0** via **NVM** (not `apt` `nodejs`) |
| Process manager | **PM2** (`ncc-backend`) |
| API bind | `127.0.0.1:4000` (proxied by Apache) |

### Filesystem layout

```
/var/www/wearencc.org/
├── assets/data/          ← backend probe copy (events.xml, site-content.json)
├── public_html/          ← DocumentRoot (HTML, full assets tree)
├── backend/              ← Node API, .env, data/, uploads/
└── deploy/               ← preflight, ecosystem.config.cjs, apache template
```

The API status probe reads `assets/data/events.xml` at the **site root** (sibling to `backend/`). Browsers load the same data from `public_html/assets/data/`. Keep both in sync on redeploy, or use `backend/src/lib/status.js` path resolution (checks `public_html/` first, then root `assets/`).

Pinnacle remains at `/var/www/pinnaclepublishinggroup.net/` — do not modify during NCC updates.

---

## Why NVM instead of apt Node

Ubuntu 18.04’s package index cannot satisfy modern Node dependencies without pulling `libc6 >= 2.28`, which conflicts with the Bionic system GLIBC. Installing Node via `apt` risks breaking the OS.

**Production approach:**

1. Install NVM in the deploy user’s home directory.
2. Install Node **24.16.0** with NVM.
3. Install PM2 globally under that Node: `npm install -g pm2`.
4. Always start PM2 from a shell where NVM is loaded (`nvm use 24` or `. ~/.nvm/nvm.sh`).

### NVM install (reference)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 24.16.0
nvm alias default 24.16.0
node -v    # v24.16.0
npm install -g pm2
```

Add NVM init to `~/.bashrc` so SSH sessions load Node automatically.

---

## GLIBC 2.28 user-space build (optional isolation)

If binaries report `GLIBC_2.28 not found` against the system loader, production used a **user-local** GLIBC 2.28 compile (no system-wide install):

| Path | Purpose |
|------|---------|
| `~/glibc-2.28/` | Source tree |
| `~/glibc-2.28/build/` | Isolated `make` sandbox |
| Built `libc.so.6` | Lives under build output in home — **not** `/lib` |

**Do not** run `sudo make install` for GLIBC on a live server unless you fully understand the risk.

After NVM Node 24 was active, the production API ran without loader errors; keep the GLIBC build documented for disaster recovery only.

---

## Cleaning legacy `node_modules`

FTP clients often fail deleting deep `node_modules` trees (`550 Remove directory operation failed`). Use SSH:

```bash
cd /var/www/wearencc.org/backend
sudo rm -rf node_modules
npm install --omit=dev
pm2 restart ncc-backend
```

---

## Required static assets

The backend status probe and calendar import expect a **non-empty** events XML file at:

```
/var/www/wearencc.org/public_html/assets/data/events.xml
```

The repository ships the full calendar. Minimal placeholder (also valid for the probe):

```xml
<?xml version="1.0" encoding="utf-8"?>
<calendar>
  <event>
    <title>Sunday Worship Service</title>
    <time>11:00 AM</time>
  </event>
</calendar>
```

Production uses the repo’s `<events>` schema; either format satisfies the file-exists/size check.

---

## Verified API endpoints

```bash
curl -s https://wearencc.org/api/health
# {"status":"ok","service":"ncc-admin-backend",...}

curl -s https://wearencc.org/api/public/status
# {"status":"operational","services":[...],...}
```

Public page: https://wearencc.org/status.html

---

## Environment files (server only)

| File | Purpose |
|------|---------|
| `public_html/assets/config/runtime.json` | Browser API base (`"apiBase": "/api"`) |
| `backend/.env` | `JWT_SECRET`, admin login, `CORS_ORIGIN`, optional OpenAI |

Never commit these to Git. Regenerate `JWT_SECRET` with `openssl rand -base64 48`.

---

## Apache proxy (both vhosts)

Both `wearencc.org.conf` and `wearencc.org-le-ssl.conf` need:

```apache
ProxyPreserveHost On
ProxyPass /api/ http://127.0.0.1:4000/api/
ProxyPassReverse /api/ http://127.0.0.1:4000/api/
ProxyPass /uploads/ http://127.0.0.1:4000/uploads/
ProxyPassReverse /uploads/ http://127.0.0.1:4000/uploads/
```

`DocumentRoot` stays `/var/www/wearencc.org/public_html`.

---

## PM2 lifecycle

```bash
cd /var/www/wearencc.org/backend
source ~/.nvm/nvm.sh
pm2 start ../deploy/ecosystem.config.cjs
pm2 save
pm2 startup    # run the printed sudo command once
```

After code updates:

```bash
cd /var/www/wearencc.org/backend
npm install --omit=dev
pm2 restart ncc-backend
```

---

## Code fixes aligned with production

| Area | File | Change |
|------|------|--------|
| Status probe paths | `backend/src/lib/status.js` | Resolves `events.xml` under `public_html/` or repo root |
| Status page UI | `assets/js/status-page.js` | Fixed `renderMetrics()` string syntax (API card) |
| XML import | `backend/scripts/import-events-xml.js` | Same dual-path lookup for `events.xml` |

---

## Related docs

- [deploy-ubuntu-wearencc.md](./deploy-ubuntu-wearencc.md) — full deploy guide (updated for NVM)
- [../deploy/CHECKLIST.md](../deploy/CHECKLIST.md) — phase checklist
- [../deploy/FILELIST.txt](../deploy/FILELIST.txt) — upload file inventory
