#!/usr/bin/env bash
#
# Add the school to a server that is already running something else.
#
# WHAT THIS DOES NOT DO — the safety properties, in order of how much they
# matter if you are doing this at one in the morning before a shop opens:
#
#   · It never stops, restarts, rebuilds or execs into the other stack's
#     containers. The POS process is not touched at any point.
#   · It never publishes a host port, installs a host package, or changes the
#     firewall, the system Node, or a host PostgreSQL.
#   · The ONLY change outside our own containers is appending a marked block
#     to the existing proxy's Caddyfile, which is backed up first.
#   · That config is validated inside the running proxy BEFORE it is applied.
#     An invalid config is refused and the running one keeps serving.
#   · Applying it is `caddy reload` — graceful and atomic, not a restart. The
#     proxy keeps serving throughout; existing connections are not dropped.
#   · Every existing site is probed before and after. If any one of them stops
#     answering, this script rolls itself back automatically, without asking.
#
# What it cannot promise: this machine's disk, memory and Docker daemon are
# shared. Building an image uses CPU and disk. Run `preflight.sh` first and
# take your own backup of the other application's data before starting.
#
#   bash integrate.sh          do it
#   bash rollback.sh           undo it
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"
ENV_FILE="$HERE/.env"
MARK_START="# >>> ststephen (added by deploy/shared-server/integrate.sh) >>>"
MARK_END="# <<< ststephen <<<"
STAMP="$(date -u +%Y%m%d-%H%M%S)"

WEBSITE_DOMAIN="${WEBSITE_DOMAIN:-}"
EMS_DOMAIN="${EMS_DOMAIN:-}"

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[1;32m✓\033[0m %s\n' "$*"; }
warn() { printf '    \033[1;33m!\033[0m %s\n' "$*"; }
die()  { printf '\n\033[1;31m!! %s\033[0m\n' "$*" >&2; exit 1; }

: "${WEBSITE_DOMAIN:?Set WEBSITE_DOMAIN, e.g. new.ststephenbulimbo.com}"
: "${EMS_DOMAIN:?Set EMS_DOMAIN, e.g. ems.ststephenbulimbo.com}"

compose() { docker compose --project-directory "$HERE" -f "$HERE/docker-compose.yml" "$@"; }

# Probe a site through the local proxy, no DNS needed.
probe() { curl -s -o /dev/null -w '%{http_code}' --max-time 10 -H "Host: $1" "http://127.0.0.1/" 2>/dev/null || echo "000"; }
alive() { [[ "$1" =~ ^[23] ]]; }

# ============================================================ 0. inspection ==
say "Step 0 — looking at what is already running (nothing is changed yet)"

command -v docker >/dev/null 2>&1 || die "Docker is not installed on this machine."
docker info >/dev/null 2>&1 || die "Cannot talk to the Docker daemon. Are you root?"

# Find the container holding port 80 — that is the proxy we must join.
PROXY="$(docker ps --format '{{.Names}}|{{.Ports}}' | awk -F'|' '$2 ~ /:80->/ {print $1; exit}')"
[[ -n "$PROXY" ]] || die "No container is publishing port 80. This script is for
   joining an existing containerised proxy. If nothing else runs on this server,
   use deploy/contabo/setup.sh instead."
ok "Existing proxy container: $PROXY"

# Its Caddyfile on the host, read from the mount rather than guessed.
PROXY_CADDYFILE="$(docker inspect -f \
  '{{range .Mounts}}{{if eq .Destination "/etc/caddy/Caddyfile"}}{{.Source}}{{end}}{{end}}' \
  "$PROXY" 2>/dev/null)"
[[ -n "$PROXY_CADDYFILE" && -f "$PROXY_CADDYFILE" ]] \
  || die "Could not find the Caddyfile that $PROXY is using. Stopping rather than guessing."
ok "Its configuration: $PROXY_CADDYFILE"

PROXY_NET="$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$PROXY" | awk '{print $1}')"
[[ -n "$PROXY_NET" ]] || die "Could not determine $PROXY's Docker network."
ok "Its network: $PROXY_NET"

# Every site it currently serves, so we can prove they still work afterwards.
mapfile -t EXISTING_SITES < <(grep -oE '^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}' "$PROXY_CADDYFILE" | sort -u)
[[ ${#EXISTING_SITES[@]} -gt 0 ]] || warn "No existing site names found in that Caddyfile."
declare -A BEFORE
for s in "${EXISTING_SITES[@]}"; do
  BEFORE["$s"]="$(probe "$s")"
  printf '    %-38s %s\n' "$s" "${BEFORE[$s]}"
done
for s in "${EXISTING_SITES[@]}"; do
  alive "${BEFORE[$s]}" || warn "$s answered ${BEFORE[$s]} BEFORE we did anything — already unhealthy."
done

if grep -q "$MARK_START" "$PROXY_CADDYFILE"; then
  warn "A previous ststephen block is already present; it will be replaced."
fi

# Resources. A build that exhausts the machine is the one real way this hurts
# the neighbours, so refuse rather than risk the OOM killer reaching them.
DISK_GB="$(df -BG --output=avail "$REPO_ROOT" | tail -1 | tr -d ' G')"
[[ "${DISK_GB:-0}" -ge 5 ]] || die "Only ${DISK_GB}GB free. The build needs ~5GB. Free space first."
ok "Disk free: ${DISK_GB}GB"
RAM_MB="$(free -m | awk '/^Mem:/{print $2}')"
SWAP_MB="$(free -m | awk '/^Swap:/{print $2}')"
if [[ "$RAM_MB" -lt 2500 && "${SWAP_MB:-0}" -lt 1000 ]]; then
  die "Only ${RAM_MB}MB RAM and ${SWAP_MB}MB swap. A Next.js build here risks the
   kernel killing processes to reclaim memory — including the other app's.
   Add swap first:  fallocate -l 2G /swapfile && chmod 600 /swapfile &&
   mkswap /swapfile && swapon /swapfile"
fi
ok "Memory: ${RAM_MB}MB RAM + ${SWAP_MB}MB swap"

for d in "$WEBSITE_DOMAIN" "$EMS_DOMAIN"; do
  if grep -qE "^\s*${d//./\\.}\s*[,{]" "$PROXY_CADDYFILE"; then
    die "$d is already configured in $PROXY_CADDYFILE by something else."
  fi
done
ok "$WEBSITE_DOMAIN and $EMS_DOMAIN are not already claimed"

# ============================================================== 1. secrets ===
say "Step 1 — secrets"
if [[ ! -f "$ENV_FILE" ]]; then
  ADMIN_PW="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)"
  cat > "$ENV_FILE" <<EOF
# St Stephen — generated $(date -u +%F). Keep secret.
DB_PASSWORD=$(openssl rand -hex 24)
AUTH_SECRET=$(openssl rand -hex 32)
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$(openssl rand -base64 32)
ADMIN_PASSWORD=$ADMIN_PW
EOF
  chmod 600 "$ENV_FILE"
  ok "Generated $ENV_FILE"
  NEW_INSTALL=1
else
  ok "Reusing the existing $ENV_FILE"
  NEW_INSTALL=0
fi

# ============================================================== 2. backup ====
say "Step 2 — backing up the proxy configuration"
BACKUP="$PROXY_CADDYFILE.ststephen-bak-$STAMP"
cp -p "$PROXY_CADDYFILE" "$BACKUP"
echo "$BACKUP" > "$HERE/.last-backup"
ok "Saved $BACKUP"
warn "This backs up the PROXY CONFIG only. Back up the other application's own
      data yourself, using its documented method, before continuing."

# ================================================= 3. build our own stack ====
# Entirely inside our Compose project. The other stack cannot be affected by
# anything in this step, even if it fails.
say "Step 3 — building the school's containers (the other app keeps running)"

say "Building the website's static files in a throwaway container"
docker run --rm \
  -v "$REPO_ROOT/apps/website":/app -w /app \
  -e NEXT_PUBLIC_EMS_URL="https://$EMS_DOMAIN" \
  node:22-alpine sh -c "npm ci --no-audit --no-fund && npm run build"
[[ -d "$REPO_ROOT/apps/website/out" ]] || die "The website build produced no out/ directory."
ok "Website built"

say "Building and starting the EMS and its database"
compose up -d --build
ok "Containers started"

say "Waiting for the EMS to answer"
for i in $(seq 1 60); do
  CODE="$(docker run --rm --network "ststephen_default" curlimages/curl:8.10.1 \
    -s -o /dev/null -w '%{http_code}' --max-time 5 http://ems:3000/api/health 2>/dev/null || echo 000)"
  alive "$CODE" && break
  sleep 3
done
alive "${CODE:-000}" || {
  compose logs --tail 40 ems || true
  die "The EMS did not come up (last response: ${CODE:-000}). Nothing outside our
   own containers has been changed — the other app is untouched. Fix and re-run."
}
ok "EMS healthy inside its own network"

# =========================================== 4. join the proxy's network =====
# `network connect` adds an interface to a running container. It does not
# restart anything, ours or theirs.
say "Step 4 — joining the proxy's network"
for svc in ems web; do
  CID="$(compose ps -q "$svc")"
  [[ -n "$CID" ]] || die "Container for '$svc' not found."
  if docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$CID" | grep -qw "$PROXY_NET"; then
    ok "$svc already on $PROXY_NET"
  else
    docker network connect --alias "ststephen-$svc" "$PROXY_NET" "$CID"
    ok "$svc joined $PROXY_NET as ststephen-$svc"
  fi
done

# ================================================= 5. add the site blocks ====
say "Step 5 — adding the two sites to the proxy configuration"
python3 - "$PROXY_CADDYFILE" "$MARK_START" "$MARK_END" <<'PY'
import sys, re
path, start, end = sys.argv[1], sys.argv[2], sys.argv[3]
text = open(path).read()
# Drop any previous block so re-running replaces rather than duplicates.
text = re.sub(re.escape(start) + r".*?" + re.escape(end) + r"\n?", "", text, flags=re.S)
open(path, "w").write(text.rstrip("\n") + "\n")
PY

cat >> "$PROXY_CADDYFILE" <<EOF

$MARK_START
# St Stephen Junior & Infant Schools. Added alongside the existing sites; the
# blocks above were not modified. Remove this whole block (or run
# deploy/shared-server/rollback.sh) to undo.
$WEBSITE_DOMAIN {
	reverse_proxy ststephen-web:80
}

$EMS_DOMAIN {
	reverse_proxy ststephen-ems:3000 {
		flush_interval -1
	}
	header {
		X-Robots-Tag "noindex, nofollow"
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
	}
	request_body {
		max_size 10MB
	}
}
$MARK_END
EOF
ok "Appended — existing blocks untouched"

say "Validating the new configuration inside the running proxy"
if ! docker exec "$PROXY" caddy validate --config /etc/caddy/Caddyfile >/tmp/hc-validate.log 2>&1; then
  cat /tmp/hc-validate.log
  cp -p "$BACKUP" "$PROXY_CADDYFILE"
  die "Configuration is invalid — restored the backup and applied nothing.
   The proxy is still running its original config; no site was affected."
fi
ok "Configuration is valid"

# =================================================== 6. apply and verify =====
say "Step 6 — reloading the proxy (graceful, not a restart)"
if ! docker exec "$PROXY" caddy reload --config /etc/caddy/Caddyfile >/tmp/hc-reload.log 2>&1; then
  cat /tmp/hc-reload.log
  cp -p "$BACKUP" "$PROXY_CADDYFILE"
  docker exec "$PROXY" caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1 || true
  die "Reload failed — restored and reloaded the original configuration."
fi
ok "Reloaded"

say "Step 7 — checking every site that was working before still works"
sleep 3
FAILED=""
for s in "${EXISTING_SITES[@]}"; do
  AFTER="$(probe "$s")"
  if alive "${BEFORE[$s]}" && ! alive "$AFTER"; then
    printf '    \033[1;31m✗ %-36s %s → %s\033[0m\n' "$s" "${BEFORE[$s]}" "$AFTER"
    FAILED="$FAILED $s"
  else
    printf '    \033[1;32m✓\033[0m %-36s %s → %s\n' "$s" "${BEFORE[$s]}" "$AFTER"
  fi
done

if [[ -n "$FAILED" ]]; then
  say "ROLLING BACK — these stopped answering:$FAILED"
  cp -p "$BACKUP" "$PROXY_CADDYFILE"
  docker exec "$PROXY" caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1 || true
  compose down >/dev/null 2>&1 || true
  sleep 3
  for s in $FAILED; do printf '    %-38s now %s\n' "$s" "$(probe "$s")"; done
  die "Rolled back automatically. The other application's configuration is exactly
   as it was, and the school's containers are stopped."
fi
ok "Every existing site still responds"

say "Checking the school's own sites through the proxy"
printf '    %-38s %s\n' "$WEBSITE_DOMAIN" "$(probe "$WEBSITE_DOMAIN")"
printf '    %-38s %s\n' "$EMS_DOMAIN" "$(probe "$EMS_DOMAIN")"

# ================================================================= done ======
cat <<EOF

--------------------------------------------------------------------
 Done. The other application was never stopped or rebuilt.

   Website   https://$WEBSITE_DOMAIN
   EMS       https://$EMS_DOMAIN

 HTTPS certificates are fetched in the background and need the DNS A
 records for both names pointing at this server. Until they resolve,
 the two names above will not load — nothing else is affected.
EOF

if [[ "$NEW_INSTALL" == "1" ]]; then
  cat <<EOF

 FIRST LOGIN — shown once:

   username   superadmin
   password   $(grep '^ADMIN_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)

 Change it in the app straight after signing in.
EOF
fi

cat <<EOF

 To undo everything:   bash $HERE/rollback.sh
 Proxy config backup:  $BACKUP
--------------------------------------------------------------------

EOF
