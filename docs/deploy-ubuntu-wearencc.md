# Deploy both sites on one Ubuntu VM (Apache + NCC + Pinnacle)

Step-by-step for **instance-20260502-213133** (`34.30.208.144`) when:

- **Pinnacle / booksales** — already live on **Apache** (`pinnaclepublishinggroup.net`)
- **NCC** — directory **`/var/www/wearencc`** exists but the app is not deployed yet
- **nginx** — not used for Pinnacle today; this guide uses **Apache on ports 80 and 443** for **both** domains

| Site | Domain | Web root | API |
|------|--------|----------|-----|
| Booksales | `pinnaclepublishinggroup.net` | (your existing Apache `DocumentRoot`) | (if any — existing setup) |
| NCC | `wearencc.org` | `/var/www/wearencc` | Node `127.0.0.1:4000` via Apache `ProxyPass` |

Only **one** program may listen on **80** and **443** on this IP. Apache routes by `ServerName`.

**Related:** [deploy-shared-server-ssl.md](./deploy-shared-server-ssl.md) (troubleshooting SSL only).

---

## Before you start

### Checklist

| Step | Booksales | NCC |
|------|-----------|-----|
| DNS A → `34.30.208.144` | `pinnaclepublishinggroup.net`, `www` | `wearencc.org`, `www` |
| GCP firewall tcp 22, 80, 443 | ✓ | ✓ |
| App files on server | Already there | Upload into `/var/www/wearencc` |
| HTTPS | Part 2 below | Part 6 after deploy |

### Confirm what is running today

SSH in, then:

```bash
sudo ss -tlnp | grep -E ':80|:443'
curl -I http://pinnaclepublishinggroup.net/
curl -I http://wearencc.org/    # may fail until DNS + vhost exist
sudo apache2ctl -S
```

Expect **Apache** on port **80** for Pinnacle. Port **443** may be closed until you run Certbot.

### SSH

```bash
gcloud compute instances list --filter="name=instance-20260502-213133"
gcloud compute ssh instance-20260502-213133 --zone=ZONE
```

---

## Part 1 — Base packages (both sites)

```bash
sudo apt update
sudo apt install -y apache2 git curl ufw ca-certificates certbot \
  python3-certbot-apache build-essential

# Node 20 for NCC API
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

node -v
apache2 -v
```

Enable Apache modules needed for NCC proxy + SSL:

```bash
sudo a2enmod proxy proxy_http headers ssl rewrite
sudo systemctl reload apache2
```

**Do not** enable nginx on 80/443 if Apache is serving Pinnacle. If nginx was installed earlier:

```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

---

## Part 2 — Pinnacle (booksales): confirm HTTP, then HTTPS

### 2.1 Do not break the live site

Pinnacle is already working. **Do not** remove or replace its Apache site file until you know its path:

```bash
sudo apache2ctl -S | grep -i pinnacle
```

Note the `DocumentRoot` and config filename (e.g. `/etc/apache2/sites-available/000-default.conf` or `pinnacle.conf`).

Verify HTTP:

```bash
curl -I http://pinnaclepublishinggroup.net/
curl -I http://www.pinnaclepublishinggroup.net/
```

Expect **200** and `Server: Apache`.

### 2.2 Open port 443 (if HTTPS fails today)

**Google Cloud:** VPC firewall → allow **tcp:443** to this VM.

**VM:**

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Apache Full'
sudo ufw enable
sudo ufw status
```

From your PC: `Test-NetConnection 34.30.208.144 -Port 443` → `TcpTestSucceeded : True`.

### 2.3 Let’s Encrypt for Pinnacle (Apache plugin)

Use **`certbot --apache`**, not `--nginx`:

```bash
sudo certbot --apache \
  -d pinnaclepublishinggroup.net -d www.pinnaclepublishinggroup.net \
  --non-interactive \
  --agree-tos \
  -m admin@pinnaclepublishinggroup.net \
  --redirect
```

Or interactive:

```bash
sudo certbot --apache -d pinnaclepublishinggroup.net -d www.pinnaclepublishinggroup.net
```

Verify:

```bash
curl -I https://pinnaclepublishinggroup.net/
sudo certbot renew --dry-run
```

Certificate files: `/etc/letsencrypt/live/pinnaclepublishinggroup.net/`

---

## Part 3 — Deploy NCC files to `/var/www/wearencc`

Directory already exists; upload the project **into** it.

```bash
sudo mkdir -p /var/www/wearencc
sudo chown -R $USER:$USER /var/www/wearencc
cd /var/www/wearencc
```

**Git:**

```bash
git clone <YOUR_REPO_URL> .
```

**Rsync from Windows** (project folder on PC):

```powershell
rsync -avz --exclude node_modules --exclude backend/node_modules --exclude .git `
  --exclude backend/data/*.json ./ YOUR_LINUX_USER@34.30.208.144:/var/www/wearencc/
```

### Frontend runtime config

```bash
cd /var/www/wearencc
cp assets/config/runtime.production.example.json assets/config/runtime.json
```

`assets/config/runtime.json`:

```json
{
  "apiBase": "/api",
  "prayerChat": {
    "useBackendAi": true,
    "persistThreads": true
  }
}
```

The browser calls **`https://wearencc.org/api/...`** on the same host; Apache proxies to Node.

---

## Part 4 — NCC backend (Node + PM2)

```bash
cd /var/www/wearencc/backend
npm install --omit=dev

cp .env.example .env
nano .env
```

`.env` (production):

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=4000
TRUST_PROXY=1

JWT_SECRET=<output of: openssl rand -base64 48>
ADMIN_EMAIL=admin@wearencc.org
ADMIN_PASSWORD=<strong password>
CORS_ORIGIN=https://wearencc.org,https://www.wearencc.org

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

```bash
openssl rand -base64 48
```

Writable dirs:

```bash
mkdir -p /var/www/wearencc/backend/data /var/www/wearencc/backend/uploads
chown -R $USER:$USER /var/www/wearencc/backend/data /var/www/wearencc/backend/uploads
```

Import calendar XML once:

```bash
cd /var/www/wearencc/backend
npm run import-events-xml
```

Test API (temporary):

```bash
node src/server.js
# other session:
curl -s http://127.0.0.1:4000/api/health
# Ctrl+C to stop
```

Start with PM2:

```bash
cd /var/www/wearencc/backend
pm2 start ../deploy/ecosystem.config.cjs
pm2 save
pm2 startup
# run the sudo command pm2 prints
```

Preflight:

```bash
cd /var/www/wearencc
bash deploy/preflight.sh
```

---

## Part 5 — Apache vhost for wearencc.org (alongside Pinnacle)

Add a **second** site; leave Pinnacle’s vhost untouched.

```bash
sudo cp /var/www/wearencc/deploy/apache/wearencc.org.conf \
  /etc/apache2/sites-available/wearencc.org.conf
sudo a2ensite wearencc.org.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

Template location in repo: `deploy/apache/wearencc.org.conf`

- Serves static files from `/var/www/wearencc`
- Proxies `/api/` and `/uploads/` → `http://127.0.0.1:4000`

List vhosts — you should see **both** Pinnacle and wearencc:

```bash
sudo apache2ctl -S
```

### HTTP test (after DNS for wearencc points here)

```bash
dig +short wearencc.org
curl -I http://wearencc.org/
curl -I http://wearencc.org/api/health
```

`api/health` should return JSON via Apache proxy.

If `wearencc.org` shows Pinnacle’s site, `ServerName` / DNS / vhost order is wrong — fix before SSL.

---

## Part 6 — Let’s Encrypt for wearencc.org

Second certificate on the **same** VM (Apache handles SNI on 443):

```bash
sudo certbot --apache \
  -d wearencc.org -d www.wearencc.org \
  --non-interactive \
  --agree-tos \
  -m admin@wearencc.org \
  --redirect
```

Verify:

```bash
curl -I https://wearencc.org/
curl -s https://wearencc.org/api/health
curl -s https://wearencc.org/assets/config/runtime.json
```

Restart Node after HTTPS (CORS uses `https://`):

```bash
pm2 restart ncc-backend
```

List all certs:

```bash
sudo certbot certificates
```

Renewal test (both sites):

```bash
sudo certbot renew --dry-run
```

---

## Part 7 — Production checklist (both sites)

| Check | URL / command |
|--------|----------------|
| Pinnacle HTTPS | https://pinnaclepublishinggroup.net/ |
| NCC home | https://wearencc.org/ |
| NCC API | `curl -s https://wearencc.org/api/health` |
| NCC admin | https://wearencc.org/admin.html |
| Calendar | https://wearencc.org/events.html |
| Runtime | `curl -s https://wearencc.org/assets/config/runtime.json` |

### First NCC admin login

1. Open **https://wearencc.org/admin.html**
2. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`
3. **Site configuration** → Reload → Save once
4. Publish calendar events as needed

---

## Part 8 — Redeploy updates

**NCC only** (typical):

```bash
cd /var/www/wearencc
git pull   # or rsync

cd backend
npm install --omit=dev
pm2 restart ncc-backend
```

Keep `backend/.env`, `assets/config/runtime.json`, and `backend/data/` on the server.

**Pinnacle:** deploy booksales files to its existing `DocumentRoot`; reload Apache only if config changed:

```bash
sudo systemctl reload apache2
```

---

## Part 9 — Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Pinnacle HTTP OK, HTTPS fails | Port 443 closed or no cert | Part 2.2–2.3, `certbot --apache` |
| **503** on HTTPS | Wrong stack (nginx SSL + Apache) | Use Apache certbot only; see [deploy-shared-server-ssl.md](./deploy-shared-server-ssl.md) |
| wearencc shows wrong site | DNS or Apache `ServerName` | `apache2ctl -S`, fix vhost |
| `502` / empty `/api/health` | Node not running | `pm2 status`, `pm2 logs ncc-backend` |
| CORS errors on NCC | `CORS_ORIGIN` still `http://` | Use `https://wearencc.org,...` in `.env`, restart PM2 |
| Certbot “no VirtualHost” | Missing `ServerName` | Enable site: `a2ensite wearencc.org.conf` |
| Address already in use :80 | nginx + Apache conflict | Stop/disable nginx |
| Two sites, one cert fails | HTTP not working for that domain | Fix HTTP per domain first |

**Diagnostics:**

```bash
sudo ss -tlnp | grep -E ':80|:443'
sudo apache2ctl -S
sudo apache2ctl configtest
sudo certbot certificates
curl -I http://pinnaclepublishinggroup.net/
curl -I https://pinnaclepublishinggroup.net/
curl -I https://wearencc.org/
curl -s http://127.0.0.1:4000/api/health
```

---

## Part 10 — Optional: nginx later (not required now)

Repo includes `deploy/nginx/*.conf` for an **nginx-only** layout. On this VM, **Apache is the production edge** until you deliberately migrate (nginx on 80/443, Apache moved to `127.0.0.1:8080` for Pinnacle, etc.). Do not mix nginx and Apache both on port 80 without a planned migration.

---

## File reference

| Path on VM | Purpose |
|------------|---------|
| `/var/www/wearencc/` | NCC static site + repo |
| `/var/www/wearencc/assets/config/runtime.json` | Browser `apiBase` |
| `/var/www/wearencc/backend/.env` | NCC secrets |
| `/var/www/wearencc/backend/data/` | Events, site-config, users |
| `/var/www/wearencc/deploy/apache/wearencc.org.conf` | Apache vhost template (NCC) |
| `/etc/apache2/sites-available/` | Enabled vhosts (Pinnacle + wearencc) |
| `/etc/letsencrypt/live/pinnaclepublishinggroup.net/` | Pinnacle TLS cert |
| `/etc/letsencrypt/live/wearencc.org/` | NCC TLS cert |
| Pinnacle `DocumentRoot` | Your existing booksales path (unchanged) |

---

## Quick command summary (order of operations)

```bash
# 1) Pinnacle HTTPS (site already live on Apache HTTP)
sudo certbot --apache -d pinnaclepublishinggroup.net -d www.pinnaclepublishinggroup.net --redirect

# 2) NCC code + API + Apache vhost
#    (upload repo, npm install, .env, pm2, a2ensite wearencc.org.conf)

# 3) NCC HTTPS
sudo certbot --apache -d wearencc.org -d www.wearencc.org --redirect

# 4) Verify renewal for both
sudo certbot renew --dry-run
```
