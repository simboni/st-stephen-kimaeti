#!/usr/bin/env bash
#
# Nightly database backup. Installed by setup.sh as /usr/local/bin/ststephen-backup
# and run from /etc/cron.d/ststephen-backup at 01:30.
#
# The database is the whole school record — pupils, fees, receipts, marks. The
# application itself stores nothing on disk, so this dump plus the git
# repository is a complete rebuild.
#
#   ststephen-backup            back up now
#   ststephen-backup --verify   back up, then prove the dump restores cleanly
set -euo pipefail

ENV_FILE="/etc/ststephen/ems.env"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/ststephen}"
KEEP_DAYS="${KEEP_DAYS:-30}"

[[ -f "$ENV_FILE" ]] || { echo "$ENV_FILE is missing"; exit 1; }
# shellcheck disable=SC1090
DATABASE_URL="$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2-)"

mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y-%m-%d_%H%M)"
OUT="$BACKUP_DIR/ststephen_$STAMP.sql.gz"

pg_dump "$DATABASE_URL" | gzip -9 > "$OUT"
chmod 600 "$OUT"

# A dump that cannot be read is not a backup. Catch corruption now, not on the
# day the server dies.
gzip -t "$OUT" || { echo "BACKUP FAILED: $OUT is corrupt"; exit 1; }
SIZE="$(du -h "$OUT" | cut -f1)"

# A near-empty dump means the database was unreachable or wiped — either way
# it must not silently replace good backups.
if [[ "$(stat -c%s "$OUT")" -lt 10240 ]]; then
  echo "BACKUP SUSPICIOUS: $OUT is only $SIZE — not rotating older backups"
  exit 1
fi

if [[ "${1:-}" == "--verify" ]]; then
  echo "Verifying the dump restores..."
  VERIFY_DB="ststephen_verify_$$"
  sudo -u postgres createdb "$VERIFY_DB"
  # shellcheck disable=SC2064
  trap "sudo -u postgres dropdb --if-exists '$VERIFY_DB'" EXIT
  gunzip -c "$OUT" | sudo -u postgres psql -q "$VERIFY_DB" >/dev/null
  PUPILS="$(sudo -u postgres psql -tAc 'SELECT count(*) FROM "Student"' "$VERIFY_DB")"
  echo "Restore verified: $PUPILS pupil records readable from the dump."
fi

find "$BACKUP_DIR" -name 'ststephen_*.sql.gz' -mtime "+$KEEP_DAYS" -delete
echo "$(date -u +%FT%TZ) backup ok: $OUT ($SIZE)"

cat <<'EOF'

NOTE: these backups sit on the same server as the database. If the machine is
lost, they go with it. Copy them somewhere else — for example, from your own
computer, nightly:

  rsync -avz --delete root@YOUR_SERVER_IP:/var/backups/ststephen/ ~/ststephen-backups/
EOF
