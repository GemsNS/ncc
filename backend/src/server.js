const fs = require("fs");
const path = require("path");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const { hashPassword } = require("./lib/auth");
const { initDataStore } = require("./lib/db");
const authRoutes = require("./routes/auth");
const mediaRoutes = require("./routes/media");
const adminRoutes = require("./routes/admin");

const app = express();

const port = Number(process.env.PORT || 4000);
const uploadsDir = path.join(__dirname, "..", "uploads");
const adminEmail = process.env.ADMIN_EMAIL || "admin@ncc.local";
const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

fs.mkdirSync(uploadsDir, { recursive: true });

initDataStore({
  id: "default-admin",
  email: adminEmail,
  role: "super_admin",
  passwordHash: hashPassword(adminPassword)
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*"
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "ncc-admin-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, req, res, next) => {
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
