# Deploying onto a shared server that fronts everything with Caddy

For the Contabo box (`vmi3487264`, 169.58.127.122) that already runs about
twenty containers belonging to other projects — smpcredits prod and staging,
riziki-pos, fitgen, cosdep, stackup, 64theatre, the portfolio — behind a
single `edge-caddy` on ports 80 and 443.

**Use this, not `deploy/shared-server/integrate.sh`,** on any server whose
Caddy config is split across `import` lines. That script lists the sites it
must protect by grepping hostnames out of the main Caddyfile; where the main
Caddyfile contains only imports it finds none, and its before/after rollback
check then passes without testing anything. `publish.sh` here asks Caddy to
`adapt` its own config instead, which has already followed every import, so
the list is whatever Caddy is really serving.

Use `deploy/contabo/setup.sh` only on a server that is the school's alone.

## What gets created

| | |
|---|---|
| `ststephen-db` | PostgreSQL 16, on a private network, **not** reachable from `edge` |
| `ststephen-ems` | the management system, on `internal` + `edge` |
| `ststephen-web` | Caddy serving the website's static files, on `edge` |
| `/srv/edge/sites/ststephen.caddy` | one new file; no existing file is edited |

No host port is published. Nothing is installed on the host. The `edge`
network is declared external — we join it, we never modify it.

## First install

```bash
git clone https://github.com/simboni/st-stephen-kimaeti /srv/ststephen/repo
cd /srv/ststephen/repo/deploy/edge

cp env.example .env && chmod 600 .env
{
  echo "DB_PASSWORD=$(openssl rand -hex 24)"
  echo "AUTH_SECRET=$(openssl rand -hex 32)"
  echo "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$(openssl rand -base64 32)"
  echo "ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)"
} >> .env

bash build-website.sh          # static files for the web container
docker compose up -d --build   # db, ems, web — still private
bash publish.sh                # the only step that touches anything shared
```

`publish.sh` refuses to go on if it cannot prove the ground first: the proxy
must be running, `curl` must exist, Caddy must report at least one hostname,
our own containers must answer healthily, and none of our names may already be
claimed. It snapshots every site's response code, writes the file, validates
*inside the running proxy*, reloads gracefully, then re-probes. If any site
that worked before stops working, it removes the file, reloads and stops —
without asking.

## Updating

```bash
cd /srv/ststephen/repo && git pull
cd deploy/edge
bash build-website.sh
docker compose up -d --build
```

The site file does not change, so `publish.sh` is not needed again. Re-running
it is safe anyway: it notices its own file is already installed, verifies every
site and exits without reloading.

## Addresses

No domain yet. These are sslip.io names, which resolve to this server's IP
without anything being registered, and get genuine Let's Encrypt certificates:

- website — `https://school.169-58-127-122.sslip.io`
- EMS — `https://ems.169-58-127-122.sslip.io`

When `ststephenkimaeti.ac.ke` exists, point two A records here, change the two
hostnames in `ststephen.caddy`, and run `publish.sh` again.

## After the first sign-in

Sign in to the EMS as `superadmin` with `ADMIN_PASSWORD` from `.env`, change it
under **Users**, then blank that line and `docker compose up -d`.

Then set the school's details under **Settings → School Settings**. They are
not taken from this repository on an existing install: `getSchoolSettings()`
upserts with an empty `update`, so the defaults in code apply only when the row
is first created. A rename in code will never reach a database that already has
that row.

## Undoing

```bash
bash publish.sh --unpublish   # stop serving it; containers and data untouched
docker compose down           # stop the containers; the volume survives
docker compose down -v        # destroy the school's records
```

## Known about this machine

- **No swap.** `build-website.sh` caps the build at 2 GB and every service has
  a `mem_limit`, because an unbounded build here is how the kernel ends up
  killing someone else's process.
- **Contabo Auto Backup is off**, and the account has been suspended for
  non-payment before. The nightly dumps this kit can take are no help if the
  whole VPS goes away.
