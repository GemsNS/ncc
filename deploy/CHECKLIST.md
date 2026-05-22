# NCC production deploy checklist

Full instructions: [docs/deploy-ubuntu-wearencc.md](../docs/deploy-ubuntu-wearencc.md)

VM: **instance-20260502-213133** · IP: **34.30.208.144** · NCC path: **/var/www/wearencc**

---

## Phase A — DNS & firewall

- [ ] `wearencc.org` A → `34.30.208.144`
- [ ] `www.wearencc.org` A → `34.30.208.144`
- [ ] GCP firewall: tcp 22, 80, 443
- [ ] `nslookup wearencc.org` shows correct IP

## Phase B — SSH

- [ ] `gcloud compute ssh instance-20260502-213133 --zone=ZONE`

## Phase C — Software

- [ ] `apache2`, `certbot`, `python3-certbot-apache`, `git`, `curl`, `ufw`
- [ ] Node 20+ (`node -v`)
- [ ] PM2 global (`pm2 -v`)
- [ ] `a2enmod proxy proxy_http headers ssl rewrite`

## Phase D — Pinnacle HTTPS (booksales untouched)

- [ ] `curl -I http://pinnaclepublishinggroup.net/` → 200
- [ ] `ufw allow 'Apache Full'`
- [ ] `certbot --apache` for pinnacle domain
- [ ] `curl -I https://pinnaclepublishinggroup.net/` → 200

## Phase E — Upload NCC files

- [ ] Project at `/var/www/wearencc/` (`index.html`, `assets/`, `backend/`, `deploy/`)
- [ ] Did **not** upload `.git`, `node_modules`, `.env`, `runtime.json`, production `data/*.json`

## Phase F — Server-only config

- [ ] `assets/config/runtime.json` from `runtime.production.example.json` (`apiBase: "/api"`)
- [ ] `backend/.env` from `.env.example` (JWT, admin password, CORS https)
- [ ] `chmod 600 backend/.env`
- [ ] `mkdir backend/data backend/uploads`

## Phase G — API

- [ ] `cd backend && npm install --omit=dev`
- [ ] `npm run import-events-xml` (optional)
- [ ] `curl http://127.0.0.1:4000/api/health` (test run)
- [ ] `pm2 start ../deploy/ecosystem.config.cjs`
- [ ] `pm2 save` + `pm2 startup`
- [ ] `bash deploy/preflight.sh` passes

## Phase H — Apache NCC vhost

- [ ] `cp deploy/apache/wearencc.org.conf` → `/etc/apache2/sites-available/`
- [ ] `a2ensite wearencc.org.conf`
- [ ] `apache2ctl configtest` → Syntax OK
- [ ] `curl http://wearencc.org/api/health` → JSON

## Phase I — NCC HTTPS

- [ ] `certbot --apache` wearencc.org + www
- [ ] `pm2 restart ncc-backend`
- [ ] `certbot renew --dry-run`

## Phase J — Browser

- [ ] https://wearencc.org/
- [ ] https://wearencc.org/events.html
- [ ] https://wearencc.org/admin.html
- [ ] Pinnacle still works on HTTPS

## Phase K — Admin

- [ ] Login with `.env` admin credentials
- [ ] Site configuration → Reload → Save

---

## File drop quick reference

| Local (repo) | Server |
|--------------|--------|
| All site files | `/var/www/wearencc/` |
| `deploy/apache/wearencc.org.conf` | `/etc/apache2/sites-available/wearencc.org.conf` |
| Create on server | `assets/config/runtime.json` |
| Create on server | `backend/.env` |
