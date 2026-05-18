# Deploy NCC to Ubuntu (wearencc.org)

This site is **not** drag-and-drop only. You need:

1. **Static files** (HTML, `assets/`) served by **nginx**
2. **Node.js backend** (`backend/`) running as a service
3. **nginx** proxying `/api` and `/uploads` to Node on `127.0.0.1:4000`

Domain: **https://wearencc.org** (and optionally **https://www.wearencc.org**)

---

## 0) Before you start

- Ubuntu server with **root SSH**
- DNS **A records** for `wearencc.org` and `www.wearencc.org` → your server’s public IP
- This repository on the server (git clone or `rsync`)

---

## 1) Install system packages

```bash
sudo apt update
sudo apt install -y nginx git curl ufw

# Node.js 20 LTS (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v   # should be v20.x
npm -v
```

Optional but recommended: **Certbot** for HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Optional: **PM2** to keep Node running

```bash
sudo npm install -g pm2
```

---

## 2) Create app directory

```bash
sudo mkdir -p /var/www/wearencc
sudo chown -R $USER:$USER /var/www/wearencc
```

### Option A — Git clone

```bash
cd /var/www/wearencc
git clone <YOUR_REPO_URL> .
```

### Option B — Upload from your PC (rsync)

From your Windows machine (PowerShell), in the project folder:

```powershell
rsync -avz --exclude node_modules --exclude backend/node_modules --exclude .git ./ user@YOUR_SERVER_IP:/var/www/wearencc/
```

---

## 3) Frontend (production config)

```bash
cd /var/www/wearencc

# Required runtime config (not in git)
cp assets/config/runtime.production.example.json assets/config/runtime.json
```

`assets/config/runtime.json` should contain:

```json
{
  "apiBase": "/api",
  "prayerChat": {
    "useBackendAi": true,
    "persistThreads": true
  }
}
```

Static files live at `/var/www/wearencc` — nginx `root` points here.  
You do **not** copy files into a separate `www` folder unless your host defines `www` as the vhost root; on Ubuntu/nginx, set `root` to `/var/www/wearencc`.

---

## 4) Backend setup

```bash
cd /var/www/wearencc/backend
npm install --omit=dev

cp .env.example .env
nano .env
```

Set **real** values in `.env`:

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=4000
TRUST_PROXY=1

JWT_SECRET=<run: openssl rand -base64 48>
ADMIN_EMAIL=admin@wearencc.org
ADMIN_PASSWORD=<strong unique password>
CORS_ORIGIN=https://wearencc.org,https://www.wearencc.org
```

Generate a secret:

```bash
openssl rand -base64 48
```

### Writable directories

```bash
sudo mkdir -p /var/www/wearencc/backend/data /var/www/wearencc/backend/uploads
sudo chown -R www-data:www-data /var/www/wearencc/backend/data /var/www/wearencc/backend/uploads
```

If you use **PM2** under your own user, either:

- run PM2 as `www-data`, or  
- `chown -R YOUR_USER:YOUR_USER` on `data/` and `uploads/` and keep nginx proxy only (no direct file access needed)

### Import bulletin events (optional, recommended once)

```bash
cd /var/www/wearencc/backend
npm run import-events-xml
```

This merges `assets/data/events.xml` into `backend/data/events.json` as **published** events.

### Test backend manually

```bash
cd /var/www/wearencc/backend
node src/server.js
```

In another SSH session:

```bash
curl -s http://127.0.0.1:4000/api/health
```

Expect: `{"status":"ok","service":"ncc-admin-backend"}`

Stop the test with `Ctrl+C`.

---

## 5) Run backend with PM2 (recommended)

```bash
cd /var/www/wearencc/backend
pm2 start ../deploy/ecosystem.config.cjs
pm2 status
pm2 logs ncc-backend --lines 50
pm2 save
pm2 startup
```

Run the command `pm2 startup` prints (sudo) so Node restarts after reboot.

**Alternative:** systemd — see `deploy/systemd/ncc-backend.service` (edit paths if needed).

---

## 6) nginx

```bash
sudo cp /var/www/wearencc/deploy/nginx/wearencc.org.conf /etc/nginx/sites-available/wearencc.org
sudo ln -sf /etc/nginx/sites-available/wearencc.org /etc/nginx/sites-enabled/wearencc.org
sudo rm -f /etc/nginx/sites-enabled/default   # if you want this site as default
sudo nginx -t
sudo systemctl reload nginx
```

Ensure static root matches:

```nginx
root /var/www/wearencc;
```

---

## 7) HTTPS (Let’s Encrypt)

After DNS has propagated:

```bash
sudo certbot --nginx -d wearencc.org -d www.wearencc.org
```

Follow prompts. Certbot updates nginx for SSL automatically.

Renewal test:

```bash
sudo certbot renew --dry-run
```

---

## 8) Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 9) Production checklist

| Check | Command / URL |
|--------|----------------|
| Home page | https://wearencc.org/ |
| API health | https://wearencc.org/api/health |
| Admin login | https://wearencc.org/admin.html |
| Events calendar | https://wearencc.org/events.html |
| Livestream config | https://wearencc.org/livestream.html |
| Drafts locked | `curl -s "https://wearencc.org/api/events?includeAll=true"` → 401 without token |
| `runtime.json` | `curl -s https://wearencc.org/assets/config/runtime.json` → `"apiBase":"/api"` |

### First admin login

1. Open **https://wearencc.org/admin.html**
2. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`
3. **Site, videos, ticker & calendar** → Reload → Save once (confirms writes to `backend/data/site-config.json`)
4. Create or publish events as needed

**Note:** Admin password is written to `backend/data/users.json` on **first** start. Changing `ADMIN_PASSWORD` in `.env` later does **not** auto-update the hash unless you delete `users.json` and restart (or change password via a future admin tool).

---

## 10) Updates (redeploy)

```bash
cd /var/www/wearencc
git pull    # or rsync again

cd backend
npm install --omit=dev
pm2 restart ncc-backend

# runtime.json and .env are preserved — do not overwrite them
```

---

## 11) What not to do

- Do **not** expose Node on `0.0.0.0:4000` publicly — bind `HOST=127.0.0.1` and use nginx only.
- Do **not** commit `.env`, `runtime.json`, or `backend/data/*.json` with real data to git.
- Do **not** use default password `ChangeMe123!` in production (server will refuse to start).
- Do **not** run multiple backend instances without **shared** `backend/data/` and `backend/uploads/` (JSON file store is single-server).

---

## 12) GitHub Pages vs this server

GitHub Pages = static only + admin **demo mode**.  
**wearencc.org** = full site with API, prayer inbox, uploads, and admin.

---

## 13) Troubleshooting

| Symptom | Fix |
|---------|-----|
| `502` on `/api/health` | `pm2 status`, `pm2 logs ncc-backend`; check `.env` and `HOST=127.0.0.1` |
| Admin login fails | Verify `users.json` exists; check email/password; see first-login note above |
| CORS errors | `CORS_ORIGIN` must include exact origin (`https://wearencc.org`) |
| Calendar empty | Run `npm run import-events-xml`; publish events in admin; XML still merges as fallback |
| Upload fails | `client_max_body_size` in nginx (26M in sample config); `uploads/` writable |
| Site config 404 | Restart backend once so `ensureSiteConfigFile()` seeds from `assets/data/` |

---

## File reference

| Path | Purpose |
|------|---------|
| `/var/www/wearencc/` | nginx document root |
| `assets/config/runtime.json` | Browser API base (`/api`) |
| `backend/.env` | Secrets and admin credentials |
| `backend/data/` | Events, users, site config, prayer inbox |
| `backend/uploads/` | Uploaded media files |
| `deploy/nginx/wearencc.org.conf` | nginx template |
| `deploy/ecosystem.config.cjs` | PM2 config |
