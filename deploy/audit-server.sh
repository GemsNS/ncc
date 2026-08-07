#!/usr/bin/env bash
# Read-only server audit for updating deploy docs / skipping completed steps.
# Run on the VM (paste entire script, or after upload):
#   bash deploy/audit-server.sh | tee ~/ncc-server-audit.txt
#
# Copy the output file back to your PC when updating documentation.

set -u

section() {
  echo ""
  echo "========== $1 =========="
}

run() {
  echo ""
  echo "--- $*"
  "$@" 2>&1 || echo "[command failed: $*]"
}

section "Meta"
echo "date: $(date -Is 2>/dev/null || date)"
echo "hostname: $(hostname)"
echo "user: $(whoami)"
if [ -f /etc/os-release ]; then
  grep -E '^(PRETTY_NAME|VERSION_ID)=' /etc/os-release || true
fi
echo "public_ip_hint: 34.30.208.144 (expected VM IP)"

section "Web server"
if command -v apache2 >/dev/null 2>&1; then
  run apache2 -v
  run apache2ctl -M
  echo ""
  echo "--- apache2ctl -S (vhosts / DocumentRoots)"
  sudo apache2ctl -S 2>&1 || apache2ctl -S 2>&1 || true
elif command -v nginx >/dev/null 2>&1; then
  run nginx -v
  run nginx -T 2>/dev/null | head -n 80
else
  echo "[none] apache2 or nginx not found"
fi

section "TLS (Certbot)"
if command -v certbot >/dev/null 2>&1; then
  run certbot --version
  echo ""
  echo "--- certbot certificates"
  sudo certbot certificates 2>&1 || certbot certificates 2>&1 || true
else
  echo "[none] certbot not installed"
fi

section "Node / PM2"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  echo "[present] ~/.nvm/nvm.sh"
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
else
  echo "[none] NVM not found at ~/.nvm/nvm.sh"
fi
if command -v node >/dev/null 2>&1; then
  run node -v
  run npm -v
  echo "node_path: $(command -v node)"
else
  echo "[none] node not installed (use NVM on Ubuntu 18.04 — not apt nodejs)"
fi
if command -v pm2 >/dev/null 2>&1; then
  run pm2 -v
  echo ""
  echo "--- pm2 list"
  pm2 list 2>&1 || true
  echo ""
  echo "--- pm2 describe ncc-backend (if exists)"
  pm2 describe ncc-backend 2>&1 || echo "[no process named ncc-backend]"
else
  echo "[none] pm2 not installed"
fi

section "Firewall / listening ports"
if command -v ufw >/dev/null 2>&1; then
  echo "--- ufw status"
  sudo ufw status verbose 2>&1 || ufw status 2>&1 || true
fi
echo ""
echo "--- ss :22 :80 :443 :4000"
sudo ss -tlnp 2>/dev/null | grep -E ':22 |:80 |:443 |:4000 ' || ss -tlnp 2>/dev/null | grep -E ':22 |:80 |:443 |:4000 ' || true

section "/var/www layout"
if [ -d /var/www ]; then
  run ls -la /var/www
  for dir in /var/www/wearencc.org /var/www/pinnaclepublishinggroup.net /var/www/html; do
    if [ -d "$dir" ]; then
      echo ""
      echo "--- $dir (top level)"
      ls -la "$dir" 2>&1 | head -n 25
    fi
  done
else
  echo "[missing] /var/www"
fi

section "NCC deploy paths (/var/www/wearencc.org)"
NCC=/var/www/wearencc.org
WEB=$NCC/public_html
if [ -d "$WEB" ]; then
  for f in index.html admin.html assets/config/runtime.json assets/data/events.xml; do
    if [ -e "$WEB/$f" ]; then
      echo "[present] public_html/$f"
    else
      echo "[missing] public_html/$f"
    fi
  done
fi
if [ -d "$NCC/backend" ]; then
  for f in .env package.json node_modules; do
    if [ -e "$NCC/backend/$f" ]; then
      echo "[present] backend/$f"
    else
      echo "[missing] backend/$f"
    fi
  done
  if [ -f "$NCC/backend/.env" ]; then
    echo "[present] backend/.env (contents not shown — secrets)"
  fi
else
  echo "[missing] $NCC/backend"
fi
if [ -f "$NCC/deploy/preflight.sh" ]; then
  echo ""
  echo "--- preflight"
  (cd "$NCC" && bash deploy/preflight.sh) 2>&1 || true
fi

section "Apache NCC vhost on system"
for f in /etc/apache2/sites-available/wearencc.org.conf \
  /etc/apache2/sites-enabled/wearencc.org.conf \
  /etc/apache2/sites-enabled/wearencc.org-le-ssl.conf; do
  if [ -f "$f" ]; then
    echo "[present] $f"
  else
    echo "[missing] $f"
  fi
done
echo ""
echo "--- DocumentRoot / ProxyPass (wearencc vhosts)"
grep -E 'DocumentRoot|ProxyPass' /etc/apache2/sites-enabled/wearencc.org*.conf 2>/dev/null || true

section "Local API health"
run curl -sS -m 5 http://127.0.0.1:4000/api/health
echo ""
echo "--- curl public status (local)"
run curl -sS -m 5 http://127.0.0.1:4000/api/public/status

section "Public HTTPS checks"
for url in \
  "https://wearencc.org/" \
  "https://wearencc.org/api/health" \
  "https://wearencc.org/api/public/status" \
  "https://pinnaclepublishinggroup.net/"; do
  echo ""
  echo "--- curl -I $url"
  curl -sS -m 10 -I "$url" 2>&1 | head -n 8 || echo "[failed] $url"
done

section "Package hints (dpkg)"
for pkg in apache2 certbot python3-certbot-apache nodejs npm git curl ufw nginx; do
  if dpkg -l "$pkg" 2>/dev/null | grep -q '^ii'; then
    dpkg -l "$pkg" 2>/dev/null | awk 'NR==2 {print "[installed]", $2, $3}'
  else
    echo "[not installed via dpkg] $pkg"
  fi
done

section "Done"
echo "Save this output: bash deploy/audit-server.sh | tee ~/ncc-server-audit.txt"
