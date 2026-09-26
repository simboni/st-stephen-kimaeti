#!/usr/bin/env bash
#
# Deploy the latest code. Run as root on the server:
#
#   bash /srv/ststephen/deploy/contabo/update.sh
#
# Pulls the branch, rebuilds both apps, applies database migrations and
# restarts the EMS. The website is swapped in atomically, so visitors never
# see a half-copied site. Pass --skip-pull to build the checkout as-is.
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/ststephen}"
WEB_ROOT="${WEB_ROOT:-/var/www/ststephen-website}"
ENV_FILE="/etc/ststephen/ems.env"
APP_USER="ststephen"
REPO_BRANCH="${REPO_BRANCH:-main}"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '\033[1;31m !! %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run this as root."
[[ -f "$ENV_FILE" ]] || die "$ENV_FILE is missing — run setup.sh first."

# The EMS build needs the encryption key baked in, and the website needs to
# know where the EMS lives, so load the service environment here too.
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ "${1:-}" != "--skip-pull" ]]; then
  say "Pulling the latest code"
  git -C "$APP_DIR" fetch --depth 1 origin "$REPO_BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$REPO_BRANCH"
  chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
fi
say "Deploying $(git -C "$APP_DIR" log --oneline -1)"

# ----------------------------------------------------------------- website ---
say "Building the website"
cd "$APP_DIR/apps/website"
npm ci --no-audit --no-fund
# NEXT_PUBLIC_* values are compiled into the JavaScript bundle, so the EMS
# address has to be present at build time, not at run time. EMS_DOMAIN comes
# from the service environment sourced above.
[[ -n "${EMS_DOMAIN:-}" ]] || die "EMS_DOMAIN is missing from $ENV_FILE."
NEXT_PUBLIC_EMS_URL="https://${EMS_DOMAIN}" npm run build
[[ -d out ]] || die "The website build produced no out/ directory."

say "Publishing the website"
rm -rf "${WEB_ROOT}.new"
cp -r out "${WEB_ROOT}.new"
chown -R "$APP_USER":"$APP_USER" "${WEB_ROOT}.new"
chmod -R a+rX "${WEB_ROOT}.new"
rm -rf "${WEB_ROOT}.old"
if [[ -d "$WEB_ROOT" ]]; then mv "$WEB_ROOT" "${WEB_ROOT}.old"; fi
mv "${WEB_ROOT}.new" "$WEB_ROOT"
rm -rf "${WEB_ROOT}.old"

# --------------------------------------------------------------------- EMS ---
say "Building the EMS"
cd "$APP_DIR/apps/ems"
npm ci --no-audit --no-fund
npm run build

say "Applying database migrations"
npx prisma migrate deploy

say "Restarting the EMS"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
systemctl restart ststephen-ems

sleep 3
if systemctl is-active --quiet ststephen-ems; then
  say "Deployed. EMS is running."
else
  die "EMS failed to start — check: journalctl -u ststephen-ems -n 50"
fi
