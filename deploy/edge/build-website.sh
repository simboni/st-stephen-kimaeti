#!/usr/bin/env bash
#
# Build the public website's static files, which the `web` container serves.
# They are not in git — `apps/website/out` is generated.
#
# Built inside a throwaway node:22-alpine container so the host needs no Node
# and nothing is installed on a machine other people's work runs on.
#
#   bash build-website.sh            preview build (asks not to be indexed)
#   SITE_PREVIEW=0 bash build-website.sh   the real launch
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"
EMS_URL="${EMS_URL:-https://ems.169-58-127-122.sslip.io}"

# Defaults to the preview build, which asks search engines not to index the
# site and says so on the page. Until the school has signed off its fee
# figures and term dates, and agreed to the photographs of identifiable
# children, this should not turn up in a search for the school's name.
SITE_PREVIEW="${SITE_PREVIEW:-1}"

printf '\n==> Building the website (preview=%s, portal→%s)\n\n' "$SITE_PREVIEW" "$EMS_URL"

# --memory caps the build. This box has no swap, so an unbounded Next build
# competing with a live POS is how the kernel ends up killing someone else's
# process.
docker run --rm \
  --memory 2g \
  -v "$REPO_ROOT/apps/website":/app -w /app \
  -e NEXT_PUBLIC_EMS_URL="$EMS_URL" \
  -e NEXT_PUBLIC_SITE_PREVIEW="$SITE_PREVIEW" \
  node:22-alpine sh -c "npm ci --no-audit --no-fund && npm run build"

[ -d "$REPO_ROOT/apps/website/out" ] || {
  echo "The build produced no out/ directory." >&2
  exit 1
}

printf '\n==> Built %s pages into apps/website/out\n' \
  "$(find "$REPO_ROOT/apps/website/out" -name 'index.html' | wc -l | tr -d ' ')"

if [ "$SITE_PREVIEW" = "1" ]; then
  echo "    PREVIEW build: asks not to be indexed. SITE_PREVIEW=0 to launch."
else
  echo "    LAUNCH build: search engines may index it."
fi

# Recreate the web container if it already exists, and do it here rather than
# leaving it to the operator.
#
# A bind mount is resolved when the container is CREATED. If `docker compose
# up` ran before this script had ever produced apps/website/out, Docker
# created that path as an empty directory and mounted the empty one — and a
# later `up` reports the container as already Running and leaves it alone.
# Caddy then serves an empty root and answers 404 for every page, while the
# files sit on the host looking perfectly correct. That is an expensive ten
# minutes to debug, and it cost us exactly that on 7 Oct 2026.
if docker ps --format '{{.Names}}' | grep -qx ststephen-web; then
  printf '\n==> Recreating ststephen-web so it picks up this build\n'
  docker compose --project-directory "$HERE" up -d --force-recreate web
  sleep 2
  if docker exec ststephen-web ls /srv/website/index.html >/dev/null 2>&1; then
    echo "    ✓ the container can see index.html"
  else
    echo "    ! the container still cannot see /srv/website/index.html" >&2
    echo "      check the mount:  docker inspect -f '{{json .Mounts}}' ststephen-web" >&2
    exit 1
  fi
else
  echo "    Now:  docker compose up -d --build"
fi
