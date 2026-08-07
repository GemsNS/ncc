# Changelog (Client Summary)

This changelog highlights the major platform upgrades completed for the NCC website and staff tools.

## Production Live — May 2026 (`wearencc.org`)

**Status:** The site is deployed and operational at **https://wearencc.org/** on Google Cloud VM `instance-20260502-213133` (`34.30.208.144`), sharing Apache with Pinnacle Publishing Group.

### Part 1 — Environment upgrades and system overhaul

#### 1. System package management and dependency resolution

- **Problem:** `sudo apt install nodejs` failed with *Unable to correct problems, you have held broken packages*. The package manager was trapped in a deep version conflict: Node packages required `libc6 (>= 2.28)` while the host OS (Ubuntu 18.04 Bionic) was locked to GLIBC 2.27.
- **Action:** Abandoned the native `apt` Node route to avoid breaking core OS libraries. Shifted runtime installation to **NVM (Node Version Manager)** so binaries live in user space.

#### 2. Dynamic library isolation (GLIBC 2.28)

- **Action:** To support modern Node without destabilizing the host OS, GNU C Library **2.28** source was unpacked to `~/glibc-2.28/`, compiled in an isolated sandbox at `~/glibc-2.28/build` (`make`), producing a compatible `libc.so.6` in the home directory.
- **Note:** No global `sudo make install` — host system libraries were left untouched.

#### 3. Remote filesystem cleanup (`node_modules` wiped)

- **Problem:** FTP transfers failed with `550 Remove directory operation failed` when deleting deeply nested folders (e.g. `typedarray` inside `node_modules`).
- **Action:** Via SSH at `/var/www/wearencc.org/backend`:

  ```bash
  sudo rm -rf node_modules
  ```

  This removed the legacy dependency tree built under the old runtime.

#### 4. Node.js runtime upgrade

- **Action:** Installed and activated **Node.js v24.16.0** via NVM.
- **Outcome:** Resolved `GLIBC_2.28 not found` execution errors. V8, npm, and PM2 are stable in production.

### Part 2 — Application code and logic fixes

#### 5. Backend status checks resilience

- **File:** `backend/src/lib/status.js`
- **Problem:** The `events-xml` probe threw when the static calendar fallback was missing or empty under the `public_html` layout, cascading the public API status into global **outage**.
- **Action:** Added path resolution for both production (`public_html/assets/data/events.xml`) and local dev (`assets/data/events.xml`) layouts. Deployments must ship a non-empty `events.xml`.

#### 6. Frontend status page script syntax repair

- **File:** `assets/js/status-page.js`
- **Problem:** Mismatched quotation marks in `renderMetrics()` (line 274) caused a parse error; the status table stayed on placeholder text (*Running checks…*).
- **Action:** Repaired the API metric card HTML string concatenation block.

### Part 3 — Verified operational infrastructure

| Endpoint | URL | Expected |
|----------|-----|----------|
| Health (simple) | `https://wearencc.org/api/health` | `{"status":"ok",...}` |
| Public status (detailed) | `https://wearencc.org/api/public/status` | `{"status":"operational",...}` |
| Service health page | `https://wearencc.org/status.html` | Live component table |

**Required static asset:** `public_html/assets/data/events.xml` must exist and be non-empty (repo includes the full calendar; minimal placeholder also satisfies the probe).

**Environment:** `JWT_SECRET`, admin credentials, CORS origins, and JSON data stores were configured on the server. All monitored components verified green after deploy.

**Full technical notes:** [docs/production-runtime.md](./production-runtime.md)

---

## Release Candidate — April 2026

### Staff Admin Portal (Ready Now)
- **Staff Admin page**: A working staff portal at `admin.html` for day-to-day content operations.
- **Events management**: Create, publish, archive, and delete events that feed the public **Events calendar**.
- **Prayer inbox**: Messages from the site’s Prayer Chat (including AI helper replies) land in an admin inbox for staff follow-up.
- **Site control center (JSON editor)**: Staff can control livestream ticker/status, video slots, and calendar feed settings via a single configuration document.

### GitHub Pages Demo Mode (Client-Friendly Demos)
- **Admin “Demo Mode”**: The admin panel can be tested on GitHub Pages without a backend by using browser-only storage (localStorage).
- **Demo content included**: Demo mode includes sample posts/content so stakeholders can see the workflow immediately.

### Livestream Control Center Enhancements
- **Config-driven ticker**: Livestream ticker content is now managed via site configuration (not hard-coded).
- **Manual or scheduled status**: Livestream status can be controlled manually (offline / starting soon / live), or driven by a simple schedule mode.
- **Service timeline control**: The “Service Timeline” overlay content can be configured per livestream state.

### Site-Wide Video Embed Management
- **Managed video slots**: Key iframe/video blocks across the site are now centrally controlled via configuration (`data-ncc-video` slots).
- **Overlay controls**: Staff can force overlays online/offline per slot for “live/offline status screens over the videos,” or leave it in automatic mode.
- **Improved resilience**: Embed reliability overlay provides consistent user messaging when embeds fail.

### Events Calendar (Public + Admin)
- **Public calendar feed**: Public events load from the API (published-only), with optional XML fallback support.
- **Admin publishing workflow**: Staff publishing directly controls what appears publicly.

### Prayer Chat + AI Helper (Public + Admin)
- **Prayer Chat widget**: Floating “Prayer Chat” experience provides encouragement and collects prayer requests.
- **Server-side AI option**: When configured, the backend can generate prayer replies (OpenAI optional) and store conversations for staff follow-up.
- **Graceful fallback**: If the API is unavailable, the Prayer Chat can fall back to a lightweight local helper.

### Blog Prototype (Internal / Not in Menus)
- **Hidden blog page**: New `blog.html` (intentionally not linked in menus).
- **Markdown support**: Blog posts support markdown for clean, readable formatting.
- **Admin blog module**: Create, publish, and manage posts inside the admin panel.
- **Example demo post**: A short demo post about the Word of God is included for presentation purposes.

### Content / Page Updates
- **Statement of Faith cleanup**: Removed the three top “image slots” on `statement-of-faith.html` per direction (ready for a single replacement image later).

### Security + Deployment Hardening
- **No public drafts**: Draft/archived content is restricted from public access (admin-only views require authentication).
- **Fail-fast production config**: Production startup requires critical environment variables (e.g., JWT secret), avoiding insecure defaults.
- **Atomic file writes**: File-based JSON storage now writes atomically to reduce corruption risk on shared hosting.
- **cPanel deployment guidance**: Added deployment documentation for a cPanel-style Node app with same-origin `/api`.
- **Service health page**: `status.html` with `/api/public/status` monitoring and footer link from all public pages.

---

## Notes
- **Production:** Backend-enabled stack on Ubuntu 18.04 + Apache + NVM Node 24 + PM2 (recommended for `wearencc.org`).
- **Demo:** GitHub Pages static deployment remains available for stakeholder review without a backend.
- The blog is a prototype concept kept **off menus** by design, but it can optionally be featured on the homepage if approved.
