# NCC production deploy checklist

Full instructions: [docs/deploy-ubuntu-wearencc.md](../docs/deploy-ubuntu-wearencc.md)  
Runtime reference: [docs/production-runtime.md](../docs/production-runtime.md)

VM: **instance-20260502-213133** · IP: **34.30.208.144** · **Live:** https://wearencc.org/

**Layout:** `public_html/` = website · `backend/` = API · Pinnacle = `/var/www/pinnaclepublishinggroup.net`

**Stack:** Ubuntu 18.04 · Apache · **NVM Node 24.16.0** · PM2 · Certbot (existing)

---

## Phase A — DNS & firewall

- [x] DNS done (both domains → this server)
- [x] GCP firewall: tcp 22, 80, 443

## Phase B — SSH

- [x] `gcloud compute ssh instance-20260502-213133 --zone=ZONE`

## Phase C — Software

- [x] **NVM** + Node **24.16.0** (`node -v`) — **not** `apt install nodejs`
- [x] PM2 global (`pm2 -v`)
- [x] `a2enmod proxy proxy_http headers ssl rewrite`

## Phase D — Upload NCC files

- [x] `index.html`, `assets/`, `*.html` → `/var/www/wearencc.org/public_html/`
- [x] `backend/` → `/var/www/wearencc.org/backend/` (no committed `.env`)
- [x] `deploy/` → `/var/www/wearencc.org/deploy/`

## Phase E — Server-only config

- [x] `public_html/assets/config/runtime.json` from example (`apiBase: "/api"`)
- [x] `backend/.env` from `.env.example` (JWT, admin password, CORS https URLs)
- [x] `chmod 600 backend/.env`
- [x] `mkdir backend/data backend/uploads`

## Phase F — API

- [x] `source ~/.nvm/nvm.sh && cd backend && npm install --omit=dev`
- [x] `npm run import-events-xml` (optional)
- [x] `curl http://127.0.0.1:4000/api/health`
- [x] `pm2 start ../deploy/ecosystem.config.cjs`
- [x] `pm2 save` + `pm2 startup`
- [x] `bash deploy/preflight.sh` passes

## Phase G — Apache API proxy

- [x] `ProxyPass /api/` and `/uploads/` on **both** `wearencc.org.conf` and `wearencc.org-le-ssl.conf`
- [x] `DocumentRoot` = `/var/www/wearencc.org/public_html`
- [x] `curl -s https://wearencc.org/api/health` → JSON

## Phase H — Browser

- [x] https://wearencc.org/
- [x] https://wearencc.org/events.html
- [x] https://wearencc.org/admin.html
- [x] https://wearencc.org/status.html
- [x] https://wearencc.org/api/public/status → operational

## Phase I — Admin

- [x] Login with `.env` admin credentials
- [x] Site configuration → Reload → Save

---

## Redeploy (routine updates)

| Upload (overwrite) | Do not overwrite |
|--------------------|------------------|
| `*.html`, `assets/`, `backend/src/`, `deploy/` | `backend/.env` |
| | `public_html/assets/config/runtime.json` |
| | `backend/data/*.json` |
| | `backend/uploads/*` |

```bash
source ~/.nvm/nvm.sh
cd /var/www/wearencc.org/backend
npm install --omit=dev
pm2 restart ncc-backend
```

## File drop quick reference

| Local (repo) | Server |
|--------------|--------|
| HTML + `assets/` | `/var/www/wearencc.org/public_html/` |
| `backend/` | `/var/www/wearencc.org/backend/` |
| `deploy/` | `/var/www/wearencc.org/deploy/` |
| Create on server | `public_html/assets/config/runtime.json` |
| Create on server | `backend/.env` |
| Required | `public_html/assets/data/events.xml` (non-empty) |
