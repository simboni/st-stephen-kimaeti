#!/usr/bin/env bash
#
# Publish St Stephen's through edge-caddy — the last step, after the website
# and the EMS are already up and answering privately.
#
# The safety logic here is ported from deploy/stephens/publish.sh on the
# `claude/st-stephens-shared-server` branch of simboni/hollycrossbulimbo,
# which worked out the hard parts on this same server. Generalised to publish
# more than one hostname.
#
# WHY NOT deploy/shared-server/integrate.sh: that script appends a marked
# block to the proxy's MAIN Caddyfile, and builds its list of sites to protect
# by grepping hostnames out of that same file. On this box /srv/edge/Caddyfile
# contains only `import` lines, so it finds zero hostnames, prints a warning,
# and carries on with an empty before/after probe list — the rollback
# guarantee is silently void. Use this instead on any server whose Caddy
# config is split across imports.
#
# What this changes: it creates ONE new file, /srv/edge/sites/ststephen.caddy,
# and reloads Caddy. It never edits another site's file, never touches
# /srv/edge/Caddyfile, and never restarts edge-caddy — a reload is a graceful,
# atomic config swap that drops no connections.
#
# If any site that answered before stops answering, it puts everything back
# without asking.
#
#   bash publish.sh                 do it
#   bash publish.sh --unpublish     remove the site file and reload
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP=ststephen
PROXY=edge-caddy
SITES_DIR=/srv/edge/sites
SITE_FILE="$SITES_DIR/$APP.caddy"
SRC="$HERE/$APP.caddy"

# Each public name's upstream, as "container:port", so the app is proved
# healthy BEFORE anything shared is touched.
UPSTREAMS=("$APP-web:80" "$APP-ems:3000")
# Only the EMS has a health endpoint; the website is plain files.
HEALTH_PATHS=("/" "/api/health")

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[1;32m✓\033[0m %s\n' "$*"; }
warn() { printf '    \033[1;33m!\033[0m %s\n' "$*"; }
die()  { printf '\n\033[1;31m!! %s\033[0m\n' "$*" >&2; exit 1; }

# Ask the proxy over the loopback with an explicit Host header, so no DNS and
# no public routing are involved. curl, not the container's busybox wget,
# because busybox follows redirects and Caddy answers port 80 with a 308 to
# HTTPS — following it would need DNS from inside the container, and a
# perfectly healthy site would read as down. A 308 here IS up.
probe() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
    -H "Host: $(probe_host "$1")" "http://127.0.0.1/" 2>/dev/null || echo 000
}

# A wildcard site cannot be probed as written — no request carries a literal
# `*` in Host. Substitute a fixed label so the site is still exercised, and
# use the same substitution before and after so a regression still shows.
probe_host() { printf '%s' "${1/#\*./caddy-probe.}"; }

# Did this site get worse? Compared by code, not by a boolean, because the
# interesting failure is a site whose config vanished: Caddy then answers 404
# for an unrecognised host, which a naive "did it respond?" check reads as
# healthy. 401 and 403 are healthy — that is an admin app refusing a stranger.
regressed() {
  local before="$1" after="$2"
  [[ "$before" =~ ^[234] ]] || return 1          # was already broken, not ours
  [[ "$after" = 000 || "$after" =~ ^5 ]] && return 0
  [[ "$after" = 404 && "$before" != 404 ]] && return 0
  return 1
}

validate() { docker exec "$PROXY" caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1; }
reload()   { docker exec "$PROXY" caddy reload --config /etc/caddy/Caddyfile; }

# ----------------------------------------------------------------- checks ---
say "Checking the ground before changing anything"

docker info >/dev/null 2>&1 || die "Cannot talk to the Docker daemon. Are you root?"
command -v curl >/dev/null 2>&1 || die "curl is needed for the before/after site
   checks. Without it this script cannot prove it broke nothing, so it stops
   rather than publish blind:  apt-get install -y curl"
docker ps --format '{{.Names}}' | grep -qx "$PROXY" || die "$PROXY is not running."
ok "$PROXY is up"
[ -d "$SITES_DIR" ] || die "$SITES_DIR does not exist — is this the right server?"
[ -f "$SRC" ] || die "$SRC is missing."

# Every hostname Caddy is ACTUALLY serving, asked of Caddy itself.
#
# `caddy adapt` converts the Caddyfile to the JSON config it runs from, which
# means it has already followed every `import`. That matters here: this box's
# main Caddyfile imports both `sites/*.caddy` AND other files directly, so
# reading only $SITES_DIR silently leaves a live POS out of the before/after
# check. Parsing the layout by hand means re-learning it every time it
# changes; asking Caddy means never being wrong about it.
harvest_served() {
  docker exec "$PROXY" caddy adapt --config /etc/caddy/Caddyfile 2>/dev/null |
    # Flatten first, so this works whether adapt prints compact or pretty
    # JSON. Safe because we only read `host` arrays, and a hostname never
    # contains a space.
    tr -d ' \n\t' |
    # Only genuine host matchers. A looser "anything that looks like a domain"
    # grep also catches Caddy's own dotted module names — http.encoders.gzip,
    # http.handlers.headers — harmless to probe but alarming to read.
    grep -oE '"host":\[[^]]*\]' |
    grep -oE '"[^"]+"' |
    grep -vx '"host"' |
    tr -d '"' |
    sort -u
}

# Hostnames declared by a Caddyfile on disk — used for our own site file,
# which is not loaded yet at the point we need to read its hostnames.
#
# Fussier than it looks, and each step earns its place:
#   · strip comments first, or a domain named in one gets probed
#   · a site address is the only thing at column 0 ending in `{` — that
#     excludes `(snippet) {` and the global `{` block
#   · split on commas: `a.com, www.a.com {` is one line, two sites
#   · require a dot and a letters-only suffix, which drops `:8443`
#
# Trimming with `tr -d '[:space:]'` would delete NEWLINES too, concatenating
# every hostname into one nonsense string that probes as unreachable both
# before and after — so a regression would never register, and the guarantee
# would be void in exactly the way this script exists to prevent. Trim per
# field with sed instead.
harvest_file() {
  sed -E 's/#.*$//' "$@" |
    grep -E '^[^[:space:]({].*\{[[:space:]]*$' |
    sed -E 's/\{[[:space:]]*$//' |
    tr ',' '\n' |
    sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' |
    grep -E '^[a-z0-9*][a-z0-9.*-]*\.[a-z]{2,}$' |
    sort -u
}

mapfile -t EXISTING < <(harvest_served)
[ "${#EXISTING[@]}" -gt 0 ] \
  || die "$PROXY reported no hostnames at all. Refusing to proceed: the
   before/after safety check would pass without testing anything, which is the
   exact failure this script exists to avoid. Check by hand:
     docker exec $PROXY caddy adapt --config /etc/caddy/Caddyfile | head"
ok "${#EXISTING[@]} hostname(s) served by $PROXY will be protected"

mapfile -t WANTED < <(harvest_file "$SRC")
[ "${#WANTED[@]}" -gt 0 ] || die "Could not read any hostname out of $SRC."
for w in "${WANTED[@]}"; do ok "will publish $w"; done

# -------------------------------------------------------------- unpublish ---
if [ "${1:-}" = "--unpublish" ]; then
  say "Unpublishing"
  [ -f "$SITE_FILE" ] || { ok "already not published"; exit 0; }
  rm -f "$SITE_FILE"
  validate || die "Config invalid after removing the file. Nothing reloaded; the
   running config is untouched. Put $SITE_FILE back and investigate."
  reload
  ok "removed and reloaded. The containers are still running, data intact."
  exit 0
fi

# ------------------------------------------------------------- collisions ---
#
# An existing site file is two different situations needing different answers.
# Someone ELSE'S file must never be overwritten. Our own file, byte-identical
# to this repo's copy, just means a previous run already published — so
# re-check health rather than refuse and leave the operator with an error.
# Re-running must be safe: an operator unsure whether the last run finished
# will run it again.
say "Proving the names are free"
ALREADY=0
if [ -e "$SITE_FILE" ]; then
  if cmp -s "$SRC" "$SITE_FILE"; then
    ALREADY=1
    ok "$SITE_FILE is already installed, byte-identical to this repo's copy"
    warn "already published by an earlier run — verifying instead of republishing"
  else
    die "$SITE_FILE exists and DIFFERS from $SRC.

   Not overwriting it: it may be another deploy's file, or a hand-edit someone
   made on the box that is not in git. Look at it first:
     diff $SITE_FILE $SRC"
  fi
else
  ok "$SITE_FILE is free"
fi

if [ "$ALREADY" = 0 ]; then
  for w in "${WANTED[@]}"; do
    if printf '%s\n' "${EXISTING[@]}" | grep -qx "$w"; then
      die "$w is already being served by this proxy. Refusing to claim it."
    fi
    if grep -rqs --include='*.caddy' -- "$w" "$SITES_DIR" 2>/dev/null; then
      die "$w appears in an existing site file in $SITES_DIR."
    fi
  done
  ok "none of our names are claimed"
fi

# ------------------------------------------------- the app must work first ---
say "Proving our own containers answer privately, before anything shared moves"
for i in "${!UPSTREAMS[@]}"; do
  up="${UPSTREAMS[$i]}"
  path="${HEALTH_PATHS[$i]}"
  name="${up%%:*}"
  docker ps --format '{{.Names}}' | grep -qx "$name" \
    || die "$name is not running. Start it first:
   cd $HERE && docker compose up -d --build"
  # caddy:2-alpine carries busybox wget, which has no GNU -S, so there is no
  # status line to parse — but it exits non-zero on 4xx/5xx or a refused
  # connection, which is the whole question.
  if ! docker exec "$PROXY" wget -q -O /dev/null -T 15 "http://$up$path" 2>/dev/null; then
    die "$PROXY cannot get a healthy answer from $up$path.

   Either the container is not on the 'edge' network, or it is unwell.
     docker inspect -f '{{json .NetworkSettings.Networks}}' $name
     docker logs --tail 50 $name

   Nothing shared has been touched; no site file was written."
  fi
  ok "$PROXY → $up$path answers healthily"
done

# --------------------------------------------------------- verify and stop ---
# Already published. There is no "before" to compare against, so report the
# health of every site as it stands and leave the config alone — a reload we
# do not need is a risk we do not need.
if [ "$ALREADY" = 1 ]; then
  say "Verifying every site, including ours"
  BAD=0
  for host in "${EXISTING[@]}"; do
    code="$(probe "$host")"
    if [[ "$code" = 000 || "$code" =~ ^5 ]]; then warn "$host: HTTP $code"; BAD=1
    else ok "$host: HTTP $code"; fi
  done
  echo
  [ "$BAD" = 0 ] || die "At least one site is not answering. Nothing was changed
   by this run. If an earlier run published while its safety check was broken,
   unpublish and investigate:  bash $0 --unpublish"
  say "All ${#EXISTING[@]} sites healthy — already published"
  printf '    https://%s\n' "${WANTED[@]}"
  exit 0
fi

# ------------------------------------------------------------- before shot ---
say "Snapshot: what is running and what answers, right now"
BEFORE_PS=$(mktemp); BEFORE_SITES=$(mktemp)
trap 'rm -f "$BEFORE_PS" "$BEFORE_SITES"' EXIT

docker ps --format '{{.Names}}\t{{.Status}}' | sort > "$BEFORE_PS"
for host in "${EXISTING[@]}"; do
  printf '%s\t%s\n' "$host" "$(probe "$host")" | tee -a "$BEFORE_SITES"
done

# ---------------------------------------------------------------- publish ---
say "Adding $SITE_FILE (one new file; nothing else is edited)"
install -m 0644 "$SRC" "$SITE_FILE"
ok "written"

say "Validating inside the running proxy — an invalid config applies nothing"
if ! validate; then
  rm -f "$SITE_FILE"
  docker exec "$PROXY" caddy validate --config /etc/caddy/Caddyfile || true
  die "Invalid config. The file has been removed and NOTHING was reloaded —
   every site is still served by the previously running config."
fi
ok "valid"

say "Reloading (graceful config swap, not a restart)"
reload
ok "reloaded"

# -------------------------------------------------------------- after shot ---
say "Proving every existing site still answers"
FAILED=0
while IFS=$'\t' read -r host was; do
  now="$(probe "$host")"
  if regressed "$was" "$now"; then
    warn "$host regressed: HTTP $was → HTTP $now"; FAILED=1
  else
    ok "$host: HTTP $was → HTTP $now"
  fi
done < "$BEFORE_SITES"

if [ "$FAILED" = 1 ]; then
  say "ROLLING BACK — removing our site file and reloading"
  rm -f "$SITE_FILE"
  validate && reload
  die "Rolled back. Our containers are still running but are not published.
   Nothing of yours should be affected; re-check with: docker ps"
fi

say "Proving nothing else moved"
if diff <(docker ps --format '{{.Names}}\t{{.Status}}' | sort | grep -v "^$APP") \
        <(grep -v "^$APP" "$BEFORE_PS"); then
  ok "every other container still counting from its original start time"
else
  warn "the list above changed. Uptimes tick, so a differing 'Up N minutes' is"
  warn "normal; a container that RESTARTED or disappeared is not."
fi

say "Published"
cat <<EOF

$(printf '    https://%s\n' "${WANTED[@]}")

Caddy is fetching Let's Encrypt certificates now; the first request to each
name can take a few seconds. Watch it:  docker logs -f $PROXY

Sign in to the EMS as  superadmin  with the ADMIN_PASSWORD from $HERE/.env.
Change it under Users immediately, then blank that line in .env and re-run
\`docker compose up -d\`.

Then set the school's own details in the app under Settings → School
Settings. They are NOT taken from this repository on an existing install:
getSchoolSettings() upserts with an empty update, so the defaults in code
apply only when the row is first created.

To undo:  bash publish.sh --unpublish
EOF
