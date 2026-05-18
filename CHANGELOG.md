# Changelog (Client Summary)

This changelog highlights the major platform upgrades completed for the NCC website and staff tools.

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

---

## Notes
- The platform supports both **backend-enabled production** (recommended) and **demo-mode** presentations (GitHub Pages) for stakeholder review.
- The blog is a prototype concept kept **off menus** by design, but it can optionally be featured on the homepage if approved.

