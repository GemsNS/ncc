/**
 * PM2 process file. From repo root:
 *   cd backend && npm install --omit=dev
 *   pm2 start ../deploy/ecosystem.config.cjs
 *   pm2 save
 */
module.exports = {
  apps: [
    {
      name: "ncc-backend",
      cwd: __dirname + "/../backend",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "300M",
      env_file: ".env",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
