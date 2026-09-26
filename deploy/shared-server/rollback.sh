#!/usr/bin/env bash
#
# Undo integrate.sh. Restores the other application's proxy configuration and
# stops the school's containers. Takes a few seconds.
#
#   bash rollback.sh            restore config, stop the school's containers
#   bash rollback.sh --purge    also delete the school's database volume
#
# The other application is never stopped here either — its proxy is reloaded
# gracefully, exactly as integrate.sh did.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MARK_START="# >>> ststephen (added by deploy/shared-server/integrate.sh) >>>"
MARK_END="# <<< ststephen <<<"

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[1;32m✓\033[0m %s\n' "$*"; }
warn() { printf '    \033[1;33m!\033[0m %s\n' "$*"; }
die()  { printf '\n\033[1;31m!! %s\033[0m\n' "$*" >&2; exit 1; }

compose() { docker compose --project-directory "$HERE" -f "$HERE/docker-compose.yml" "$@"; }
probe() { curl -s -o /dev/null -w '%{http_code}' --max-time 10 -H "Host: $1" "http://127.0.0.1/" 2>/dev/null || echo "000"; }

PROXY="$(docker ps --format '{{.Names}}|{{.Ports}}' | awk -F'|' '$2 ~ /:80->/ {print $1; exit}')"
[[ -n "$PROXY" ]] || die "No container is publishing port 80 — nothing to restore."
PROXY_CADDYFILE="$(docker inspect -f \
  '{{range .Mounts}}{{if eq .Destination "/etc/caddy/Caddyfile"}}{{.Source}}{{end}}{{end}}' "$PROXY")"
[[ -f "$PROXY_CADDYFILE" ]] || die "Could not locate $PROXY's Caddyfile."

say "Restoring $PROXY_CADDYFILE"
if [[ -f "$HERE/.last-backup" ]] && [[ -f "$(cat "$HERE/.last-backup")" ]]; then
  BACKUP="$(cat "$HERE/.last-backup")"
  cp -p "$BACKUP" "$PROXY_CADDYFILE"
  ok "Restored from $BACKUP"
else
  # No backup recorded: strip our marked block instead, leaving the rest alone.
  warn "No backup file recorded — removing only the marked ststephen block"
  python3 - "$PROXY_CADDYFILE" "$MARK_START" "$MARK_END" <<'PY'
import sys, re
path, start, end = sys.argv[1], sys.argv[2], sys.argv[3]
text = open(path).read()
new = re.sub(re.escape(start) + r".*?" + re.escape(end) + r"\n?", "", text, flags=re.S)
open(path, "w").write(new.rstrip("\n") + "\n")
print("    removed the ststephen block" if new != text else "    no ststephen block found")
PY
fi

say "Reloading the proxy"
if docker exec "$PROXY" caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1; then
  docker exec "$PROXY" caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1 \
    && ok "Reloaded" || warn "Reload reported a problem — check: docker logs $PROXY"
else
  die "The restored configuration does not validate. NOT reloading — the proxy is
   still serving its previous config from memory, so sites are still up. Inspect
   $PROXY_CADDYFILE by hand before doing anything else."
fi

say "Stopping the school's containers"
compose down >/dev/null 2>&1 && ok "Stopped (the database volume is kept)" || warn "Nothing was running"

if [[ "${1:-}" == "--purge" ]]; then
  say "Deleting the school's database volume"
  compose down -v >/dev/null 2>&1 || true
  docker volume rm ststephen_db-data >/dev/null 2>&1 && ok "Volume deleted" || warn "Volume already gone"
fi

say "Checking the other application's sites"
mapfile -t SITES < <(grep -oE '^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}' "$PROXY_CADDYFILE" | sort -u)
for s in "${SITES[@]}"; do printf '    %-38s %s\n' "$s" "$(probe "$s")"; done

echo
echo "Rollback complete. Nothing of the school's remains in the proxy config."
echo
