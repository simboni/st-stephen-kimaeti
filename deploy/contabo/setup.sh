#!/usr/bin/env bash
#
# St Stephen platform — one-time server setup for a fresh Ubuntu 22.04/24.04 box
# (Contabo VPS or any other provider). Installs and wires up:
#
#   Caddy       reverse proxy, automatic HTTPS from Let's Encrypt
#   PostgreSQL  local only, never exposed to the internet
#   Node 22     runs the EMS under systemd
#   ufw         firewall: SSH, HTTP, HTTPS and nothing else
#
# Run as root on the server:
#
#   WEBSITE_DOMAIN=ststephenbulimbo.com \
#   EMS_DOMAIN=ems.ststephenbulimbo.com \
#   LETSENCRYPT_EMAIL=you@example.com \
#   bash setup.sh
#
# Safe to re-run: every step checks before it acts. Secrets are generated once
# and kept in /etc/ststephen/ems.env; re-running never rewrites them.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/simboni/st-stephen-kimaeti}"
REPO_BRANCH="${REPO_BRANCH:-main}"
APP_DIR="${APP_DIR:-/srv/ststephen}"
WEB_ROOT="${WEB_ROOT:-/var/www/ststephen-website}"
ENV_FILE="/etc/ststephen/ems.env"
APP_USER="ststephen"
DB_NAME="ststephen"
DB_USER="ststephen"
EMS_PORT="3000"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m !  %s\033[0m\n' "$*"; }
die() { printf '\033[1;31m !! %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run this as root (sudo bash setup.sh)."
: "${WEBSITE_DOMAIN:?Set WEBSITE_DOMAIN, e.g. ststephenbulimbo.com}"
: "${EMS_DOMAIN:?Set EMS_DOMAIN, e.g. ems.ststephenbulimbo.com}"
: "${LETSENCRYPT_EMAIL:?Set LETSENCRYPT_EMAIL for certificate expiry warnings}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# This script updates $APP_DIR with `git reset --hard`, and bash reads a script
# incrementally as it runs. If we are executing from inside $APP_DIR, that reset
# can rewrite this file underneath the interpreter. Re-exec from a copy first.
if [[ "$HERE" == "$APP_DIR"/* && "${STSTEPHEN_REEXEC:-}" != "1" ]]; then
  TMP_KIT="$(mktemp -d)"
  cp -r "$HERE/." "$TMP_KIT/"
  export STSTEPHEN_REEXEC=1
  exec bash "$TMP_KIT/setup.sh" "$@"
fi

# --------------------------------------------------------------- co-tenants ---
# This script was written for a server dedicated to the school. On a box that
# already hosts something else, several steps below are destructive. Refuse to
# run rather than take a working service down; preflight.sh explains each case.
say "Checking for anything already running on this server"
# Read listening ports from whatever this machine offers, ending at
# /proc/net/tcp, which always exists. A guard that cannot see the ports must
# not conclude they are free.
if command -v ss >/dev/null 2>&1; then
  PORTS="$(ss -tlnH 2>/dev/null | awk '{print $4}' | sed -E 's/.*[:.]([0-9]+)$/\1/')"
elif command -v netstat >/dev/null 2>&1; then
  PORTS="$(netstat -tln 2>/dev/null | awk '/^tcp/{print $4}' | sed -E 's/.*[:.]([0-9]+)$/\1/')"
elif [[ -r /proc/net/tcp ]]; then
  PORTS="$(awk '$4=="0A"{split($2,a,":"); print a[2]}' /proc/net/tcp /proc/net/tcp6 2>/dev/null \
    | while read -r hex; do printf '%d\n' "0x$hex" 2>/dev/null; done)"
else
  die "Cannot read this machine's listening ports, so a collision with an
     existing service cannot be ruled out. Install iproute2 and re-run."
fi
port_busy() { grep -qx "$1" <<<"$PORTS"; }
BLOCKERS=()

if command -v node >/dev/null 2>&1 && [[ "$(node -v)" != v22* ]]; then
  BLOCKERS+=("Node $(node -v) is installed system-wide; installing Node 22 would replace it.")
fi
if port_busy 80 || port_busy 443; then
  BLOCKERS+=("Ports 80/443 are already in use; Caddy would collide with that server.")
fi
if [[ -f /etc/caddy/Caddyfile ]] && ! grep -q 'St Stephen' /etc/caddy/Caddyfile 2>/dev/null; then
  BLOCKERS+=("/etc/caddy/Caddyfile belongs to other sites and would be overwritten.")
fi
if port_busy "$EMS_PORT"; then
  BLOCKERS+=("Port $EMS_PORT is taken. Re-run with a free one: EMS_PORT=3200 bash setup.sh")
fi
if [[ -e "$APP_DIR" && ! -d "$APP_DIR/.git" ]]; then
  BLOCKERS+=("$APP_DIR exists and is not a git checkout; it would be deleted.")
fi
if command -v psql >/dev/null 2>&1 && systemctl is-active --quiet postgresql 2>/dev/null; then
  if [[ "$(sudo -u postgres psql -tAc 'SHOW listen_addresses' 2>/dev/null)" == "*" ]]; then
    BLOCKERS+=("PostgreSQL accepts remote connections; restricting it to localhost would cut off whatever uses that.")
  fi
fi

if [[ ${#BLOCKERS[@]} -gt 0 && "${I_KNOW_THIS_SERVER_IS_SHARED:-}" != "yes" ]]; then
  printf '\n\033[1;31mRefusing to run — this server is not empty:\033[0m\n'
  for b in "${BLOCKERS[@]}"; do printf '  · %s\n' "$b"; done
  cat <<'MSG'

Run `bash preflight.sh` for the full picture. Safest options:

  1. Give the school its own server. Nothing here can then be affected.
  2. Send the preflight report to Claude to adapt the install to co-exist.

Nothing has been changed.
MSG
  exit 1
fi

# ---------------------------------------------------------------- packages ---
say "Installing system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  ca-certificates curl gnupg git ufw fail2ban openssl \
  postgresql postgresql-contrib \
  debian-keyring debian-archive-keyring apt-transport-https unattended-upgrades

# Caddy — official repo. Gives us HTTPS certificates with zero configuration
# and, unlike nginx, streams responses by default (Next.js needs that).
if ! command -v caddy >/dev/null 2>&1; then
  say "Installing Caddy"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy
fi

# Node 22 — matches the version the app is built and tested against.
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v22* ]]; then
  say "Installing Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
say "Node $(node -v), npm $(npm -v)"

# Next.js builds are memory-hungry; a small VPS needs swap or the build is
# killed halfway through with no useful error.
TOTAL_MB=$(free -m | awk '/^Mem:/{print $2}')
if [[ "$TOTAL_MB" -lt 4000 ]] && [[ ! -f /swapfile ]]; then
  say "Only ${TOTAL_MB}MB RAM — adding a 2GB swapfile so the build can finish"
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ------------------------------------------------------------------- user ----
if ! id "$APP_USER" >/dev/null 2>&1; then
  say "Creating the $APP_USER service account"
  adduser --system --group --home "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
fi

# --------------------------------------------------------------- database ----
say "Configuring PostgreSQL"
systemctl enable --now postgresql

DB_PASSWORD=""
if [[ -f "$ENV_FILE" ]] && grep -q '^DATABASE_URL=' "$ENV_FILE"; then
  # Re-run: keep the password already in use, or the app loses its database.
  DB_PASSWORD="$(grep '^DATABASE_URL=' "$ENV_FILE" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')"
else
  DB_PASSWORD="$(openssl rand -hex 24)"
fi

sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 \
  || sudo -u postgres psql -qc "CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -qc "ALTER ROLE $DB_USER PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 \
  || sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"

# PostgreSQL listens on localhost only by default on Ubuntu. Assert it, because
# an exposed database with a guessable password is how schools get breached.
PG_CONF="$(sudo -u postgres psql -tAc 'SHOW config_file')"
OTHER_DBS="$(sudo -u postgres psql -tAc \
  "SELECT count(*) FROM pg_database WHERE datistemplate=false AND datname NOT IN ('postgres','$DB_NAME')" 2>/dev/null || echo 0)"
if grep -qE "^\s*listen_addresses\s*=\s*'\*'" "$PG_CONF"; then
  if [[ "${OTHER_DBS:-0}" -gt 0 ]]; then
    # Something else uses this server; locking the database to localhost and
    # restarting it would be someone else's outage.
    warn "PostgreSQL accepts remote connections and hosts $OTHER_DBS other database(s).
    Leaving that alone. The school's data is still only reachable with its own
    credentials, but consider restricting the server to localhost when you can."
  else
    warn "PostgreSQL was listening on all interfaces — restricting it to localhost"
    sed -i "s/^\s*listen_addresses\s*=.*/listen_addresses = 'localhost'/" "$PG_CONF"
    systemctl restart postgresql
  fi
fi

# ------------------------------------------------------------------ source ---
say "Fetching the application source"
if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" fetch --depth 1 origin "$REPO_BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$REPO_BRANCH"
else
  rm -rf "$APP_DIR"
  git clone --depth 1 --branch "$REPO_BRANCH" "$REPO_URL" "$APP_DIR"
fi

# ----------------------------------------------------------------- secrets ---
mkdir -p /etc/ststephen
if [[ ! -f "$ENV_FILE" ]]; then
  say "Generating secrets"
  ADMIN_PASSWORD="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)"
  cat > "$ENV_FILE" <<EOF
# St Stephen EMS — service environment. Generated by setup.sh.
# Keep this file secret: it holds the database password and signing keys.
NODE_ENV=production
PORT=$EMS_PORT
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@127.0.0.1:5432/$DB_NAME
# Signs the login session cookies.
AUTH_SECRET=$(openssl rand -hex 32)
# Must stay constant across rebuilds, otherwise forms submitted mid-deploy fail
# with "Failed to find Server Action".
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$(openssl rand -base64 32)
# Password for the very first superadmin login. Used once, when the database is
# empty. Change the password in the app afterwards; this line then does nothing.
ADMIN_PASSWORD=$ADMIN_PASSWORD
# Never put the demo pupils, demo staff or the shared demo password on a real
# school's server.
SEED_DEMO=false
# Where each app is served. The website compiles the EMS address into its
# contact and complaint forms at build time, so update.sh reads it from here.
WEBSITE_DOMAIN=$WEBSITE_DOMAIN
EMS_DOMAIN=$EMS_DOMAIN
EOF
  chmod 600 "$ENV_FILE"
  NEW_INSTALL=1
else
  say "Keeping the existing secrets in $ENV_FILE"
  NEW_INSTALL=0
fi
chown root:"$APP_USER" "$ENV_FILE"
chmod 640 "$ENV_FILE"

# ----------------------------------------------------------------- systemd ---
# The unit goes in before the build, because update.sh finishes by restarting
# the service — on a fresh box that would fail if the unit did not exist yet.
say "Installing the EMS service"
install -m 644 "$HERE/ststephen-ems.service" /etc/systemd/system/ststephen-ems.service
systemctl daemon-reload
systemctl enable ststephen-ems

# ------------------------------------------------------------------- build ---
say "Building the website and the EMS (a few minutes)"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
bash "$HERE/update.sh" --skip-pull

# ------------------------------------------------------------------- caddy ---
say "Configuring Caddy for $WEBSITE_DOMAIN and $EMS_DOMAIN"
sed -e "s|{{WEBSITE_DOMAIN}}|$WEBSITE_DOMAIN|g" \
    -e "s|{{EMS_DOMAIN}}|$EMS_DOMAIN|g" \
    -e "s|{{WEB_ROOT}}|$WEB_ROOT|g" \
    -e "s|{{EMS_PORT}}|$EMS_PORT|g" \
    -e "s|{{LETSENCRYPT_EMAIL}}|$LETSENCRYPT_EMAIL|g" \
    "$HERE/Caddyfile" > /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile >/dev/null || die "Caddyfile is invalid"
systemctl enable --now caddy
systemctl reload caddy

# ---------------------------------------------------------------- firewall ---
say "Configuring the firewall"
# Adding allow rules is always safe. TURNING THE FIREWALL ON is not: ufw's
# default-deny would instantly cut off every other service's port. So enable it
# only when it is already on, or when explicitly asked.
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
if ufw status 2>/dev/null | head -1 | grep -qi inactive; then
  if [[ "${MANAGE_FIREWALL:-}" == "yes" ]]; then
    ufw --force enable >/dev/null
    say "Firewall enabled (SSH, HTTP, HTTPS allowed)"
  else
    warn "Firewall left OFF. Rules for SSH/HTTP/HTTPS are staged but not active,
    because enabling ufw here would block any other service on this machine.
    Once you have confirmed which ports must stay open:
        ufw allow <port>/tcp    # for each one
        ufw enable"
  fi
else
  say "Firewall already active — added the rules the school's sites need"
fi
systemctl enable --now fail2ban

# Security updates apply themselves; an unpatched server is the likeliest way
# this box gets compromised.
dpkg-reconfigure -f noninteractive unattended-upgrades >/dev/null 2>&1 || true

# ----------------------------------------------------------------- backups ---
say "Installing nightly database backups"
install -m 755 "$HERE/backup.sh" /usr/local/bin/ststephen-backup
mkdir -p /var/backups/ststephen
chown "$APP_USER":"$APP_USER" /var/backups/ststephen
cat > /etc/cron.d/ststephen-backup <<'EOF'
# Nightly database dump at 01:30 server time, 30 days kept.
30 1 * * * root /usr/local/bin/ststephen-backup >> /var/log/ststephen-backup.log 2>&1
EOF

# ------------------------------------------------------------------ finish ---
sleep 3
if systemctl is-active --quiet ststephen-ems; then
  say "EMS service is running"
else
  warn "EMS service is not running — check: journalctl -u ststephen-ems -n 50"
fi

cat <<EOF

--------------------------------------------------------------------
 Setup complete.

   Website   https://$WEBSITE_DOMAIN
   EMS       https://$EMS_DOMAIN

 Both need their DNS A records pointing at this server's IP address
 before the HTTPS certificates can be issued.
EOF

if [[ "$NEW_INSTALL" == "1" ]]; then
  cat <<EOF

 FIRST LOGIN — shown once, write it down now:

   username   superadmin
   password   $(grep '^ADMIN_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)

 Sign in, then change it under Users & Logins. No other account exists
 and no demo data was created.
EOF
fi

cat <<EOF

 Useful commands:
   systemctl status ststephen-ems      service health
   journalctl -u ststephen-ems -f      live logs
   bash $HERE/update.sh                deploy the latest code
   /usr/local/bin/ststephen-backup     back up the database now
--------------------------------------------------------------------

EOF
