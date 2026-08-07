# Deploy assets

Use with the full guide: **[docs/deploy-ubuntu-wearencc.md](../docs/deploy-ubuntu-wearencc.md)**  
Production runtime (NVM, GLIBC, live endpoints): **[docs/production-runtime.md](../docs/production-runtime.md)**

| File / folder | Copy to (on server) | When |
|---------------|---------------------|------|
| `apache/wearencc.org.conf` | `/etc/apache2/sites-available/wearencc.org.conf` | After API is running (Phase H) |
| `ecosystem.config.cjs` | (stay in repo) `pm2 start ../deploy/ecosystem.config.cjs` | Phase G |
| `preflight.sh` | Run from repo root: `bash deploy/preflight.sh` | After config + before going live |
| `audit-server.sh` | Run on VM: `bash deploy/audit-server.sh \| tee ~/ncc-server-audit.txt` | **Before deploy** — see what's already installed |
| `FILELIST.txt` | Reference only | Full tree + flat file list for upload |
| `systemd/ncc-backend.service` | `/etc/systemd/system/` | Optional instead of PM2 |
| `nginx/*.conf` | Not used on shared Apache VM | Only if migrating off Apache |

**Checklist:** [CHECKLIST.md](./CHECKLIST.md)
