# ncc
New Community Church - Suffolk, VA

# Brand Outline: NCC Family

This brand identity is built on a high-contrast, digital-first aesthetic using the deep blacks and luminous blues found in your source image.

---

## 1. Color Palette

| Element | Color Hex | Visual Role |
| :--- | :--- | :--- |
| **Midnight** | `#0B0B0C` | Primary background and foundation. |
| **Electric Cobalt** | `#2E42FF` | Main brand color and primary actions. |
| **Neon Cyan** | `#00F5D4` | High-visibility accents and hover states. |
| **Deep Indigo** | `#3A1078` | Secondary gradients for depth. |
| **Soft White** | `#F8F9FA` | Body text and readable content. |

---

## 2. Typography

* **Primary Heading (H1, H2):** **Inter** (Extra Bold / 800)
    * Tight letter spacing for high-impact statements.
* **Secondary Heading (H3, H4):** **Montserrat** (Semi-Bold / 600)
    * All-caps with increased letter spacing for a premium look.
* **Body Copy:** **Inter** (Regular / 400)
    * Light grey (`#D1D1D1`) text to ensure accessibility on dark backgrounds.

---

## 3. Visual Identity & Style

* **Mesh Gradients:** Soft-edge transitions between Cobalt and Cyan.
* **Glassmorphism:** Semi-transparent containers with a background blur.
* **Glow Effects:** Subtle outer glows on primary call-to-action buttons.
* **Corner Radius:** Rounded corners (**12px**) to keep the interface approachable.

---

## 4. UI Component Design

### Buttons
* **Primary:** Solid Electric Cobalt with white text.
* **Secondary:** Transparent with a Cyan border and Cyan text.

### Navigation
* **Header:** Fixed position with a frosted glass effect to show content beneath during scroll.

### Iconography
* **Style:** Minimalist line icons.
* **Stroke:** 2pt weight using the Neon Cyan color.

---

## 5. Brand Tone
> **"Reliability through Innovation"**
>
> A bridge between traditional values and a digital-first future. The dark theme suggests stability, while the neon accents represent energy and growth.

OLD WEBSITE: https://www.nccfamily.us/

---

## 6. Phase 4 Backend (Custom Admin)

The project now includes a custom Node.js backend in `backend/` for:

- Admin authentication (`/api/auth/login`, `/api/auth/me`)
- Media upload and lifecycle (`/api/media/upload`, publish/archive routes)
- Audit trail (`/api/admin/audit`)

### Local Run

1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and set secure values
4. `npm start`

Backend default local URL: `http://localhost:4000`

### Admin Panel

- Open `admin.html` in your static site.
- Log in with the backend admin credentials from your environment.
- Upload media and manage publish/archive status.

### Notes

- This backend is for dedicated hosting environments (not GitHub Pages-only hosting).
- Uploaded files are served from `backend/uploads`.
- Runtime data files are in `backend/data`.

---

## 7. Complete Changelog

This changelog summarizes all major implementation work completed for the NCC rebrand and digital platform.

### Phase 1 - Foundation and Brand System

- Established the core brand palette, typography, tone, and component rules.
- Built responsive global layout and base navigation across all public pages.
- Added reusable styling tokens and glass/gradient UI treatment.

### Phase 2 - Site Build and Page Expansion

- Implemented/expanded key pages: `index.html`, `about.html`, `ministries.html`, `messages.html`, `gallery.html`, `events.html`, `contact.html`, `give.html`, `brand.html`, `colors.html`, `admin.html`.
- Added stronger section architecture and richer content blocks across the site.
- Converted multiple "empty" sections into narrative, media-supported experiences.

### Phase 3 - Live Media and Dynamic Content

- Added "Live Control Center" ticker system with structured label/value chips.
- Added "Program Runtime Overlay" and dynamic live status behavior.
- Added robust media archive rendering and filtering by search/tag/speaker.
- Added sermon notes support and richer media metadata display.

### Phase 4 - Admin Experience and Backend

- Created backend service in `backend/` with:
  - Auth routes (`/api/auth/login`, `/api/auth/me`)
  - Media lifecycle routes (`/api/media/*`)
  - Admin audit routes (`/api/admin/audit`)
- Added file-based persistence and upload storage.
- Added frontend admin panel with:
  - Login
  - Upload pipeline
  - Media status controls (`draft`, `pending_review`, `published`, `archived`)
  - Audit trail rendering
  - Demo-mode data fallback

### Phase 5 - GitHub Pages and Static Compatibility

- Added GitHub Pages deployment workflow in `.github/workflows/deploy-gh-pages.yml`.
- Kept static deployment compatibility for demos while preserving backend migration path.
- Added static API-like endpoints under `api/sharefaith/` for giving integrations.

### Phase 6 - UX / Visual Upgrades

- Added global light/dark mode toggle with persistent theme state.
- Added lock/unlock preview gate flow and protected landing page (`under-construction.html`).
- Added "Lock Site" action for demo sessions.
- Added responsive ambient background system with mouse-reactive blobs.
- Improved light mode contrast and overall visual polish.

### Phase 7 - Navigation and Information Architecture

- Added collapsible "More" navigation tree for admin/brand utilities.
- Moved `Give` to the highlighted 4th nav position with elevated styling.
- Added dynamic nav link insertion for new Inspiration pathways.

### Phase 8 - Social, Embed, and Feed Reliability

- Reworked social implementations to use resilient link/image + controlled embeds.
- Added Anthony Facebook feed integration and wellness stream wiring.
- Added dedicated `anthony-inspiration.html` page for pastoral digital content.
- Added global embed reliability layer:
  - Timed load checks
  - Error handling
  - Professional offline overlays
  - Retry controls

### Phase 9 - Anthony Inspiration Content and Experience

- Added large Anthony website feed panel on `anthony-inspiration.html`.
- Added curated scraped content blocks from Anthony's Inspiration:
  - About summary
  - Signature quote
  - Featured book summary
  - Latest blog spotlight
  - Website section map
- Added cinematic motion header inspired by landing-page visual language.
- Updated social data model in `assets/data/site-content.json` to include:
  - `socialFeeds.anthonyWebsite`
  - `socialFeeds.anthonyFacebook`
  - `socialFeeds.wednesdayWellnessWalk`
  - live `pastorBlog` status/URL fields

### Phase 10 - Content Governance and Placeholder System

- Added centralized placeholder binding system (`assets/js/placeholders.js`).
- Expanded `assets/data/site-content.json` to act as a primary content source.
- Added placeholder key documentation in `docs/placeholder-keys.md`.

### Phase 11 - Give Page and Legacy Archive

- Recreated giving experience and integrated static Sharefaith information endpoints.
- Added `legacy-content.html` for historic/reference content from older sources.
- Added stronger calls-to-action and media context around giving and archives.

### Phase 12 - Reliability and Bug Fixes

- Fixed broken QR generation with multi-provider fallback and resilient text fallback.
- Removed/updated unstable embeds across pages with safer alternatives.
- Improved Facebook/video panel handling for network/privacy restrictions.
- Fixed command palette visibility bug (`.command-palette[hidden] { display:none; }`).
- Iteratively refined logo asset handling and SVG/PNG consistency.

### Phase 13 - Statement of Faith Implementation

- Imported and implemented the official Statement of Faith from provided PDF source.
- Added dedicated public doctrine page: `statement-of-faith.html`.
- Added dynamic navigation access (`Faith`) across site pages via shared nav enhancement in `assets/js/site.js`.

### Current Status

- Frontend: GitHub Pages-ready static deployment.
- Backend: Available for dedicated hosting environments.
- Admin: Demo mode + backend mode supported.
- Social/Media: Multi-layer fallback strategy implemented.