#!/bin/sh
# Apply any pending database migrations, then serve.
#
# `migrate deploy` only ever applies migration files that have not run yet; it
# never drops or rewrites data, and doing nothing is the normal case on
# restart. If it fails the container exits rather than serving against a schema
# the code does not expect.
set -e

echo "[ststephen] applying database migrations…"
npx prisma migrate deploy

echo "[ststephen] starting the EMS on port ${PORT:-3000}"
exec node node_modules/next/dist/bin/next start
