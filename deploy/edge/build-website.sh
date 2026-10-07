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
echo "    Now:  docker compose up -d web"
