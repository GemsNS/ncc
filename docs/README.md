# NCC documentation

| Guide | Use when |
|-------|----------|
| [deploy-ubuntu-wearencc.md](./deploy-ubuntu-wearencc.md) | **Production (start here)** — both sites on one VM: Pinnacle (Apache, live) + NCC (`/var/www/wearencc`) + SSL for each |
| [deploy-shared-server-ssl.md](./deploy-shared-server-ssl.md) | HTTPS troubleshooting supplement (Apache, not nginx) |
| [deploy-cpanel.md](./deploy-cpanel.md) | Shared hosting with cPanel and reverse proxy to Node |
| [placeholder-keys.md](./placeholder-keys.md) | `data-ph` placeholder keys and site-config fields |
| [admin-phase2-plan.md](./admin-phase2-plan.md) | Planned admin enhancements |

## Quick architecture

```mermaid
flowchart TB
  subgraph vm ["VM 34.30.208.144 — Apache :80 / :443"]
    Apache["Apache by ServerName"]
    Pinnacle["Pinnacle static site"]
    NccStatic["/var/www/wearencc HTML"]
    Node["NCC Node :4000"]
  end
  Browser["Browser"]
  Browser --> Apache
  Apache -->|pinnaclepublishinggroup.net| Pinnacle
  Apache -->|wearencc.org /| NccStatic
  Apache -->|wearencc.org /api| Node
```

On the shared VM, **Apache** terminates TLS for **both** domains. NCC static files live under `/var/www/wearencc`; `/api` is proxied to Node on localhost. `assets/config/runtime.json` sets `"apiBase": "/api"`.
