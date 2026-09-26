# Running the platform on your own server (Contabo or any VPS)

One Ubuntu server runs everything: the public website, the EMS and the
PostgreSQL database. This is the deployment the school owns outright — the
pupil records sit on a machine you control, not on someone else's service.

```
                    Internet
                       │
                 ports 80 / 443
                       │
         ┌─────────────▼──────────────┐
         │  Caddy — HTTPS, automatic  │
         └──────┬──────────────┬──────┘
                │              │
   ststephenbulimbo.com    ems.ststephenbulimbo.com
                │              │
       static website     ┌────▼─────────────────┐
       (plain files)      │  EMS (Node, systemd) │
                          └────┬─────────────────┘
                               │ localhost only
                          ┌────▼──────────┐
                          │  PostgreSQL   │
                          └───────────────┘
```

The database never listens on the public internet, and the firewall allows
only SSH, HTTP and HTTPS.

## First: is the server already hosting something?

`setup.sh` assumes the machine is the school's alone. On a server that already
runs something, several of its steps are destructive — installing Caddy on
busy ports, replacing the system Node, enabling a firewall that closes every
other service's port. **Always run the read-only check first:**

```bash
bash deploy/contabo/preflight.sh
```

It changes nothing and prints `OK` / `WARN` / `STOP` per item. `setup.sh` also
refuses to start if it detects a conflict, so a mistake here costs nothing.

> **Known conflict: the Riziki POS server.** `simboni/peter-misiati`
> (`apps/riziki-pos`) deploys a **Caddy container holding ports 80 and 443**,
> serving `rizikichemicals.co.ke`, `www.` and `pos.`, with the shop's SQLite
> database in `apps/riziki-pos/data/`. If St Stephen goes on that same machine,
> a second web server **cannot** be installed — the school's two sites have to
> be added to that existing Caddy instead, and its config lives in the POS repo
> at `apps/riziki-pos/deploy/Caddyfile`, not in `/etc/caddy`. Ask before
> touching it: restarting that container interrupts a live shop.

## What you need

- A Contabo VPS (or equivalent) running **Ubuntu 22.04 or 24.04**, 4 GB RAM or
  more. Choose a **German data centre** — Kenya's undersea cables route to
  Europe, so Nuremberg or Düsseldorf is the quickest option Contabo offers.
- Root SSH access to it.
- Control of the domain's DNS records.

## Step 1 — point the domains at the server

At your DNS provider, create two records pointing at the server's IP address:

| Type | Name | Value |
|------|------|-------|
| A | `@` (or `ststephenbulimbo.com`) | your server IP |
| A | `ems` | your server IP |

Do this **first**. Caddy proves it controls the domains in order to obtain the
HTTPS certificates, which it cannot do until DNS resolves to this server.

> **The school's existing system.** `ststephenbulimbo.com` currently serves the
> Smart School install the school uses every day. Repointing it moves the whole
> school onto the new site the moment DNS propagates. Until you are ready for
> that cutover, use a spare name — put `new` and `ems` records in instead and
> run `WEBSITE_DOMAIN=new.ststephenbulimbo.com`. Everything below works the
> same, and nothing the school currently relies on moves.

## Step 2 — run the setup script

SSH in as root and run:

```bash
apt-get update && apt-get install -y git
git clone --depth 1 https://github.com/simboni/st-stephen-kimaeti /srv/ststephen
cd /srv/ststephen/deploy/contabo

WEBSITE_DOMAIN=ststephenbulimbo.com \
EMS_DOMAIN=ems.ststephenbulimbo.com \
LETSENCRYPT_EMAIL=you@example.com \
bash setup.sh
```

It takes roughly ten minutes and does all of the following: installs Node 22,
PostgreSQL, Caddy and the firewall; creates the database with a generated
password; generates the signing secrets; builds both applications; installs the
EMS as a system service that restarts on crash and on reboot; obtains the HTTPS
certificates; and schedules nightly database backups.

It is safe to re-run. Secrets are generated once and never overwritten.

### Write down the first password

At the end it prints the first login **once**:

```
   username   superadmin
   password   <generated>
```

Sign in at `https://ems.ststephenbulimbo.com`, then change it under
**Users & Logins**. This is the only account that exists, and no demo data is
created — no sample pupils, staff, fees or payments.

If you lose the password before first login, it is still in
`/etc/ststephen/ems.env` as `ADMIN_PASSWORD`. Once you have changed it in the
app, that line stops having any effect.

## Step 3 — set the school up

In the EMS, in this order:

1. **Settings → School Settings** — name, contacts, logo.
2. **Settings → Sessions & Terms** — create the real academic year with the
   school's real term dates. Fee billing is driven by these dates, so guessing
   them mis-bills every pupil.
3. **Academics → Classes & Streams** — the twelve CBC classes and one stream
   each already exist; add or rename streams to match the school.
4. **Fees → Fees Setup** — the vote heads (Tuition, Examinations, Lunch,
   Boarding, Activity) exist; set the real amount for each class and term.
5. **Students → Import CSV** — bulk-import the roll.
6. **Opening balances** — for pupils who owe money from before, add a
   `Balance b/f` adjustment on each fee account so arrears carry across.
7. **Staff** — add staff, then create their logins under Users & Logins.

Pilot with the front office and one class for a week before switching the
school off Smart School.

## Everyday operations

| Task | Command (as root on the server) |
|------|--------------------------------|
| Deploy the latest code | `bash /srv/ststephen/deploy/contabo/update.sh` |
| Service health | `systemctl status ststephen-ems` |
| Live logs | `journalctl -u ststephen-ems -f` |
| Restart the EMS | `systemctl restart ststephen-ems` |
| Back up now | `ststephen-backup` |
| Back up and prove it restores | `ststephen-backup --verify` |

`update.sh` rebuilds both apps, applies any new database migrations and
restarts the service. The website is swapped in atomically, so visitors never
catch a half-copied site.

## Backups — read this part

The database is the entire school record. The application stores nothing else
on disk, so a database dump plus the public git repository rebuilds everything.

A nightly dump runs at 01:30 and thirty days are kept in
`/var/backups/ststephen`. **Those backups are on the same server as the
database**, so a dead server loses both. Copy them somewhere else — from your
own computer, nightly:

```bash
rsync -avz --delete root@YOUR_SERVER_IP:/var/backups/ststephen/ ~/ststephen-backups/
```

Once a term, prove a backup actually restores:

```bash
ststephen-backup --verify
```

It restores the dump into a scratch database, counts the pupil records and
throws the scratch copy away. A backup nobody has ever restored is a guess.

### Restoring after a disaster

On a fresh server, run `setup.sh` as in step 2, then load the most recent dump:

```bash
systemctl stop ststephen-ems
sudo -u postgres dropdb ststephen && sudo -u postgres createdb -O ststephen ststephen
gunzip -c /path/to/ststephen_YYYY-MM-DD_HHMM.sql.gz | sudo -u postgres psql ststephen
systemctl start ststephen-ems
```

## Keeping it secure

The setup script enables automatic security updates, a firewall limited to SSH,
HTTP and HTTPS, and fail2ban against SSH brute-forcing. Beyond that:

- **Use SSH keys and turn off password login.** Contabo servers are scanned
  within minutes of coming online. In `/etc/ssh/sshd_config` set
  `PasswordAuthentication no`, then `systemctl restart ssh` — after confirming
  your key works in a second terminal.
- **Change the first-login password**, and give every staff member their own
  account. Shared logins destroy the audit trail's value.
- **Reboot monthly** so kernel updates take effect: `reboot`.

## If something breaks

**The site shows a certificate error or does not load.** DNS is not pointing at
this server yet, or has not propagated. Check with `dig +short yourdomain.com`
from your own machine — it must print the server's IP. Then
`journalctl -u caddy -n 50`.

**The EMS shows 502 Bad Gateway.** The Node service is down.
`systemctl status ststephen-ems` and `journalctl -u ststephen-ems -n 50`. The
usual cause after a deploy is a failed database migration.

**"Failed to find Server Action" after a deploy.** A browser tab loaded before
the deploy is submitting a form to the new build. Reloading the page fixes it.
`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` in `/etc/ststephen/ems.env` keeps this
rare; never regenerate that value.

**The build is killed partway through.** The server ran out of memory. The
setup script adds swap on machines under 4 GB; if you are already at 4 GB or
more and still hitting it, deploy during quiet hours or size up.

**Nobody can log in and the database is empty.** The bootstrap refuses to
create an administrator without `ADMIN_PASSWORD`, rather than falling back to a
publicly known password. Check the value exists in `/etc/ststephen/ems.env`,
then `systemctl restart ststephen-ems`.

## Service environment reference

`/etc/ststephen/ems.env` — readable only by root and the service account.

| Variable | What it does |
|----------|--------------|
| `DATABASE_URL` | PostgreSQL connection, localhost only |
| `AUTH_SECRET` | Signs login session cookies |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Must stay constant across rebuilds |
| `ADMIN_PASSWORD` | First superadmin password; used only while the database has no users |
| `SEED_DEMO` | `false` on a real server. `true` plants demo pupils and the shared demo password — throwaway databases only |
| `WEBSITE_DOMAIN` / `EMS_DOMAIN` | Where each app is served; the website compiles the EMS address into its forms at build time |
| `PORT` | Port the EMS listens on behind Caddy (default 3000) |
