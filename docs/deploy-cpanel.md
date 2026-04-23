# Deploying NCC on cPanel (Node + same-origin `/api`)

This repo supports a **static site** + **Node.js API** deployment where the browser talks to the backend at the same origin:

- Public site: `https://yourdomain.com/`
- API: `https://yourdomain.com/api/*`

## 1) cPanel prerequisites

- cPanel hosting with **“Setup Node.js App”** / Passenger support
- Ability to set **environment variables** for the Node app
- Ability to configure a **reverse proxy** / rewrite so `/api/*` routes to the Node app

If your cPanel host does not support Node apps, you can still deploy the static site, but **admin + API features won’t work**.

## 2) Backend setup (Node app)

### App root and start command

- **Application root**: `backend/`
- **Startup file**: `src/server.js`
- **Start command**: `node src/server.js`
- **PORT**: use the port cPanel assigns (or set `PORT` in env vars if required)

### Required environment variables

Copy `backend/.env.example` → `backend/.env` for local testing. On cPanel, set these as environment variables:

- `NODE_ENV=production`
- `PORT=<assigned by platform>`
- `JWT_SECRET=<long random string>`
- `ADMIN_EMAIL=<your admin email>`
- `ADMIN_PASSWORD=<strong password>`
- `CORS_ORIGIN=https://yourdomain.com`

Optional (enables richer prayer replies):

- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-4o-mini`

### Writable directories

The backend uses JSON storage on disk (single-instance friendly):

- `backend/data/` (users, events, audit, prayer inbox, site config)
- `backend/uploads/` (uploaded files)

Ensure both directories are writable by the Node process.

## 3) Static site config (`runtime.json`)

The browser loads `assets/config/runtime.json` at runtime to find the API base URL.

For same-origin `/api`, use:

```json
{
  "apiBase": "/api",
  "prayerChat": { "useBackendAi": true, "persistThreads": true }
}
```

`assets/config/runtime.example.json` is the template. `assets/config/runtime.json` should be **environment-provided** (it is ignored by git).

## 4) First run checklist

1. Visit `https://yourdomain.com/admin.html`
2. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
3. In **“Site, videos, ticker & calendar feed”**, click **Reload**, then **Save** once to confirm writes succeed.
4. Visit:
   - `https://yourdomain.com/livestream.html` (ticker/status + main embed comes from site-config)
   - `https://yourdomain.com/events.html` (calendar pulls published events from API; XML is fallback)
5. Confirm public cannot access drafts:
   - `GET /api/events?includeAll=true` should return 401/403 without auth

## 5) Notes on persistence

This backend is **file-based**. It’s ideal for:

- cPanel single-instance Node apps
- a single VPS instance

It is **not** safe for multi-replica / ephemeral container platforms without shared storage.

