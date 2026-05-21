# Shared VM: SSL troubleshooting (Apache)

**Main deploy guide (both sites, step-by-step):** [deploy-ubuntu-wearencc.md](./deploy-ubuntu-wearencc.md)

This page is a short supplement when something goes wrong with HTTPS on **34.30.208.144**.

---

## Expected stack

| Site | Web server | SSL command |
|------|------------|-------------|
| `pinnaclepublishinggroup.net` | **Apache** (already live on HTTP) | `sudo certbot --apache -d pinnaclepublishinggroup.net -d www.pinnaclepublishinggroup.net` |
| `wearencc.org` | **Apache** vhost + Node proxy | `sudo certbot --apache -d wearencc.org -d www.wearencc.org` |

**Do not** use `certbot --nginx` for Pinnacle while Apache serves the site.

**Do not** install nginx on ports 80/443 alongside Apache without a full migration plan.

---

## Common issues

| Symptom | Fix |
|---------|-----|
| HTTP 200, HTTPS connection refused | Open GCP + `ufw` port 443; run `certbot --apache` |
| HTTPS 503 | Remove broken nginx SSL vhost; use `certbot --apache` |
| Certbot no VirtualHost | `sudo apache2ctl -S` — fix `ServerName`, `a2ensite`, reload Apache |
| Wrong site on HTTPS | Separate certs per domain; check `apache2ctl -S` |

```bash
sudo ss -tlnp | grep -E ':80|:443'
sudo apache2ctl -S
sudo certbot certificates
sudo certbot renew --dry-run
```

---

## nginx templates in repo

`deploy/nginx/wearencc.org.conf` and `deploy/nginx/pinnaclepublishinggroup.net.conf` are for a **future nginx-front** setup only. They are **not** used in the current Apache-based dual-site deploy.
