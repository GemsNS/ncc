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