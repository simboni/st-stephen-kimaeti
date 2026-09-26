#!/usr/bin/env bash
#
# READ-ONLY inspection. Changes nothing, installs nothing, restarts nothing.
#
# Run this BEFORE setup.sh on any server that already hosts something. It
# reports what is already running and whether the St Stephen install would
# collide with it:
#
#   bash preflight.sh
#
# Every finding is one of:
#   OK     nothing in the way
#   WARN   setup.sh adapts, but read the note
#   STOP   setup.sh would break something already running
set -uo pipefail   # deliberately no -e: a failed probe must not end the report

EMS_PORT="${EMS_PORT:-3000}"
APP_DIR="${APP_DIR:-/srv/ststephen}"
stops=0
warns=0

hdr() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  \033[1;32mOK  \033[0m %s\n' "$*"; }
warn() { printf '  \033[1;33mWARN\033[0m %s\n' "$*"; warns=$((warns+1)); }
stop() { printf '  \033[1;31mSTOP\033[0m %s\n' "$*"; stops=$((stops+1)); }

printf '\033[1mSt Stephen — server preflight check\033[0m\n'
printf 'Host: %s   %s\n' "$(hostname)" "$(date -u '+%F %T UTC')"

# ------------------------------------------------------------- the basics ---
# Listening TCP ports, however this machine will tell us. /proc/net/tcp is the
# last resort and always present on Linux, so we never fall through to "found
# nothing" and call a busy server clean.
# Decide the source FIRST: assigning it inside the function would be lost, as
# piping the function runs it in a subshell.
if command -v ss >/dev/null 2>&1; then PORT_SOURCE="ss"
elif command -v netstat >/dev/null 2>&1; then PORT_SOURCE="netstat"
elif [[ -r /proc/net/tcp ]]; then PORT_SOURCE="/proc/net/tcp"
else PORT_SOURCE=""
fi

listening_ports() {
  case "$PORT_SOURCE" in
    ss) ss -tlnH 2>/dev/null | awk '{print $4}' | sed -E 's/.*[:.]([0-9]+)$/\1/' ;;
    netstat) netstat -tln 2>/dev/null | awk '/^tcp/{print $4}' | sed -E 's/.*[:.]([0-9]+)$/\1/' ;;
    /proc/net/tcp)
      awk '$4=="0A"{split($2,a,":"); print a[2]}' /proc/net/tcp /proc/net/tcp6 2>/dev/null \
        | while read -r hex; do printf '%d\n' "0x$hex" 2>/dev/null; done ;;
  esac
}
PORTS="$(listening_ports | sort -un)"
# Process names only when a tool can supply them; absence is cosmetic.
LISTEN="$( (ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null) || true )"
port_busy() { grep -qx "$1" <<<"$PORTS"; }
port_owner() {
  grep -E "[:.]$1\s" <<<"$LISTEN" | grep -oP '(?<=users:\(\(")[^"]+' | head -1
}

hdr "Machine"
. /etc/os-release 2>/dev/null || true
echo "  ${PRETTY_NAME:-unknown OS}, kernel $(uname -r)"
RAM_MB=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}')
DISK_AVAIL=$(df -BG --output=avail / 2>/dev/null | tail -1 | tr -d ' G')
echo "  RAM ${RAM_MB}MB, root disk ${DISK_AVAIL}GB free"
case "${VERSION_ID:-}" in
  22.04|24.04) ok "Ubuntu version is supported" ;;
  *) warn "Built and tested on Ubuntu 22.04/24.04 — yours is ${PRETTY_NAME:-unknown}" ;;
esac
[[ "${RAM_MB:-0}" -ge 2000 ]] || warn "Under 2GB RAM — builds may be killed even with swap"
[[ "${DISK_AVAIL:-0}" -ge 5 ]] || warn "Under 5GB free — the build needs room for node_modules"

# ------------------------------------------------------------------ Node ----
hdr "Node.js"
if command -v node >/dev/null 2>&1; then
  NODE_V="$(node -v)"
  if [[ "$NODE_V" == v22* ]]; then
    ok "Node $NODE_V already installed — nothing changes"
  else
    stop "Node $NODE_V is installed system-wide. setup.sh installs Node 22 from
         NodeSource, which REPLACES it. Anything here running on $NODE_V could
         break. Use the isolated install (see the end of this report)."
  fi
  if command -v pm2 >/dev/null 2>&1; then
    warn "pm2 is installed — other Node apps are likely managed by it:
         $(pm2 list 2>/dev/null | grep -cE '^\│ [0-9]' || echo '?') process(es)"
  fi
else
  ok "No Node installed — Node 22 can be added cleanly"
fi

# -------------------------------------------------------------- web server --
hdr "Web server on ports 80 / 443"
if [[ -z "$PORT_SOURCE" ]]; then
  stop "Could not read the listening ports on this machine, so collisions cannot
         be ruled out. Install iproute2 (apt-get install -y iproute2) and re-run
         this check rather than assuming the ports are free."
fi
web_busy=0
for p in 80 443; do
  if port_busy "$p"; then
    echo "  port $p is in use by: $(port_owner "$p" || echo 'unknown process')"
    web_busy=1
  fi
done
if [[ "$web_busy" == "0" ]]; then
  ok "Ports 80 and 443 are free — Caddy can take them"
else
  if grep -qi caddy <<<"$LISTEN"; then
    if [[ -f /etc/caddy/Caddyfile ]]; then
      stop "Caddy is already serving other sites. setup.sh OVERWRITES
         /etc/caddy/Caddyfile, which would take every one of them offline.
         Your existing sites:
$(grep -oE '^[a-z0-9.*-]+\.[a-z]{2,}' /etc/caddy/Caddyfile 2>/dev/null | sed 's/^/           /' | head -10)"
    fi
  else
    stop "Another web server (nginx/Apache/Traefik) holds 80/443. Installing
         Caddy would fail to bind, and could disable the running one. The
         school's sites must be added to THAT server instead."
  fi
fi
for s in nginx apache2 caddy traefik; do
  systemctl is-active --quiet "$s" 2>/dev/null && echo "  service running: $s"
done

# ------------------------------------------------------------- PostgreSQL ---
hdr "PostgreSQL"
if command -v psql >/dev/null 2>&1 && systemctl is-active --quiet postgresql 2>/dev/null; then
  DBS="$(sudo -u postgres psql -tAc \
    "SELECT datname FROM pg_database WHERE datistemplate=false AND datname<>'postgres'" 2>/dev/null)"
  COUNT="$(grep -c . <<<"$DBS" 2>/dev/null || echo 0)"
  if [[ "$COUNT" -gt 0 ]]; then
    warn "PostgreSQL already holds $COUNT database(s):
$(sed 's/^/           /' <<<"$DBS")
         setup.sh only ADDS a 'ststephen' database and role — existing data is
         untouched. But it also restarts PostgreSQL, briefly dropping every
         connection, and forces listen_addresses to localhost."
    LA="$(sudo -u postgres psql -tAc 'SHOW listen_addresses' 2>/dev/null)"
    if [[ "$LA" == "*" ]]; then
      stop "listen_addresses is '*' — something connects to this database from
         off-box. setup.sh would force it to localhost and cut that off."
    fi
  else
    ok "PostgreSQL installed with no other databases"
  fi
else
  ok "No PostgreSQL running — it will be installed fresh"
fi

# -------------------------------------------------------------- firewall ----
hdr "Firewall"
if command -v ufw >/dev/null 2>&1; then
  if ufw status 2>/dev/null | head -1 | grep -qi inactive; then
    OTHER_PORTS="$(grep -vE "^(22|80|443|5432|53|${EMS_PORT})$" <<<"$PORTS" | tr '\n' ' ')"
    if [[ -n "$OTHER_PORTS" ]]; then
      stop "The firewall is OFF and these ports are open and in use: $OTHER_PORTS
         setup.sh turns ufw ON allowing only 22/80/443 — everything on those
         other ports becomes unreachable the moment it runs."
    else
      ok "Firewall inactive, and nothing is listening on unusual ports"
    fi
  else
    ok "ufw already active — setup.sh only adds allow rules for 80/443"
    ufw status numbered 2>/dev/null | sed -n '2,8p' | sed 's/^/     /'
  fi
  if command -v docker >/dev/null 2>&1 && docker ps -q 2>/dev/null | grep -q .; then
    warn "Docker is running. Docker writes its own iptables rules, so ports
         published by containers stay reachable whether ufw is on or off —
         ufw neither protects nor blocks them. Judge container exposure from
         'docker ps', not from 'ufw status'."
  fi
else
  ok "ufw not installed yet"
fi

# ------------------------------------------------------------- app's port ---
hdr "Port $EMS_PORT (the EMS)"
if port_busy "$EMS_PORT"; then
  stop "Port $EMS_PORT is taken by $(port_owner "$EMS_PORT" || echo 'another process').
         Run setup.sh with a free port:  EMS_PORT=3200 bash setup.sh"
else
  ok "Port $EMS_PORT is free"
fi

# ------------------------------------------------------------------ other ---
hdr "Other tenants"
if command -v docker >/dev/null 2>&1; then
  RUNNING="$(docker ps --format '{{.Names}}|{{.Image}}|{{.Ports}}' 2>/dev/null)"
  if [[ -n "$RUNNING" ]]; then
    echo "  Running containers:"
    awk -F'|' '{printf "    %-22s %-24s %s\n", $1, $2, $3}' <<<"$RUNNING"
    # A containerised reverse proxy holds 80/443 without anything appearing in
    # /etc/caddy or /etc/nginx, so the host-level checks above can miss it.
    WEBCONTAINER="$(awk -F'|' '$3 ~ /:(80|443)->/ {print $1}' <<<"$RUNNING" | tr '\n' ' ')"
    if [[ -n "$WEBCONTAINER" ]]; then
      stop "Container(s) [$WEBCONTAINER] publish ports 80/443. The school's sites
         must be added to THAT proxy's configuration — a second web server
         cannot bind the same ports, and installing one risks the sites those
         containers serve. Send this report to Claude for the integration."
    fi
    # Named volumes and bind mounts are where other tenants keep their data.
    warn "Do not prune Docker images or volumes while integrating — other
         containers' data may live in them."
  else
    ok "Docker installed, no containers running"
  fi
else
  ok "No Docker"
fi
if [[ -e "$APP_DIR" && ! -d "$APP_DIR/.git" ]]; then
  stop "$APP_DIR exists but is not a git checkout — setup.sh would DELETE it."
else
  ok "$APP_DIR is free or already our checkout"
fi

# ----------------------------------------------------------------- verdict ---
hdr "Verdict"
if [[ "$stops" -eq 0 && "$warns" -eq 0 ]]; then
  echo "  Clean server. setup.sh is safe to run."
elif [[ "$stops" -eq 0 ]]; then
  echo "  $warns warning(s), no blockers. setup.sh can run — read the warnings."
else
  echo "  $stops blocker(s) and $warns warning(s)."
  echo
  echo "  DO NOT run setup.sh as-is. Either:"
  echo "    1. Put the school on its own server (cleanest — nothing here can be"
  echo "       touched, and a small VPS costs a few euros a month), or"
  echo "    2. Send this report to Claude and it will adapt the install to sit"
  echo "       alongside what is already running."
fi
echo
echo "  Nothing on this server was changed by this check."
echo
