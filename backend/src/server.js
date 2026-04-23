const fs = require("fs");
const path = require("path");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const { hashPassword } = require("./lib/auth");
const { initDataStore } = require("./lib/db");
const { ensureSiteConfigFile } = require("./lib/siteConfig");
const authRoutes = require("./routes/auth");
const mediaRoutes = require("./routes/media");
const adminRoutes = require("./routes/admin");
const eventRoutes = require("./routes/events");
const prayerRoutes = require("./routes/prayer");
const blogRoutes = require("./routes/blog");
const publicRoutes = require("./routes/public");
const adminSiteConfigRoutes = require("./routes/admin-site-config");

const app = express();

const port = Number(process.env.PORT || 4000);
const uploadsDir = path.join(__dirname, "..", "uploads");
const nodeEnv = String(process.env.NODE_ENV || "production").toLowerCase();
const adminEmail = process.env.ADMIN_EMAIL || "admin@ncc.local";
const adminPassword = process.env.ADMIN_PASSWORD || "";

function requireEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error("Missing required env var: " + name);
  }
  return value;
}

if (nodeEnv !== "development") {
  requireEnv("JWT_SECRET");
  requireEnv("CORS_ORIGIN");
  if (!adminPassword || adminPassword === "ChangeMe123!") {
    throw new Error("ADMIN_PASSWORD must be set to a strong value (not default)");
  }
}

fs.mkdirSync(uploadsDir, { recursive: true });

initDataStore({
  id: "default-admin",
  email: adminEmail,
  role: "super_admin",
  passwordHash: hashPassword(adminPassword)
});

ensureSiteConfigFile();

const allowedOrigins = String(process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) {
        return cb(null, true);
      }
      if (!allowedOrigins.length) {
        return cb(null, false);
      }
      return cb(null, allowedOrigins.includes(origin));
    }
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "ncc-admin-backend" });
});

app.use("/api/public", publicRoutes);
app.use("/api/admin/site-config", adminSiteConfigRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/prayer", prayerRoutes);
app.use("/api/blog", blogRoutes);

app.use((err, req, res, next) => {
  if (nodeEnv === "development") {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  if (err && (err.statusCode === 400 || err.type === "entity.parse.failed")) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File exceeds 25MB limit" });
  }
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  process.stdout.write(
    "NCC backend running on http://localhost:" + port + "\n" +
      "Default admin: " + adminEmail + " (change via env vars)\n"
  );
});
