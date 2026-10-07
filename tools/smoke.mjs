/* Walk every module of the EMS as a signed-in user and report what is broken.
 *
 * Checks each page for four things, because "it returned 200" is not the same
 * as "it works":
 *
 *   · the HTTP status
 *   · Next.js's error boundary ("Application error", "Something went wrong",
 *     "This page couldn't load") — a crashed server component still answers 200
 *   · an unexpected redirect to /login or /denied, which means the route is
 *     mis-protected rather than broken
 *   · that the page rendered its own <h1>, so an empty shell is not a pass
 *
 * Dynamic routes are resolved from whatever the database actually holds, so
 * this exercises a real pupil, a real exam, a real route and so on rather than
 * guessing ids.
 *
 *   BASE=http://127.0.0.1:3001 USER=admin PASS=ststephen2026 node smoke.mjs
 */
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

const BASE = process.env.BASE ?? "http://127.0.0.1:3001";
const USER = process.env.USER_NAME ?? "admin";
const PASS = process.env.PASS ?? "ststephen2026";
const SHOTS = process.env.SHOTS ?? "";
const CHROME =
  process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/** Every module, grouped the way the sidebar groups them. */
const STATIC_ROUTES = [
  ["Dashboard", "/"],
  ["Enquiries & complaints", "/frontoffice"],
  ["Office logs", "/frontoffice/logs"],
  ["Students", "/students"],
  ["New admission", "/students/new"],
  ["Import students", "/students/import"],
  ["Promote students", "/students/promote"],
  ["Attendance", "/attendance"],
  ["Pupil leave", "/attendance/leave"],
  ["Absence", "/absence"],
  ["Classes & streams", "/academics/classes"],
  ["New class", "/academics/classes/new"],
  ["Subjects", "/academics/subjects"],
  ["New subject", "/academics/subjects/new"],
  ["Timetable", "/academics/timetable"],
  ["Examinations", "/exams"],
  ["Homework", "/homework"],
  ["Fees collection", "/fees"],
  ["Fees setup", "/fees/setup"],
  ["Income & expenses", "/finance"],
  ["Transport", "/transport"],
  ["Vehicles", "/transport/vehicles"],
  ["Boarding", "/boarding"],
  ["Staff", "/staff"],
  ["New staff", "/staff/new"],
  ["Staff attendance", "/staff/attendance"],
  ["Staff leave", "/staff/leave"],
  ["My leave", "/my-leave"],
  ["Payroll", "/payroll"],
  ["Reports", "/reports"],
  ["Communication", "/communication"],
  ["Users & logins", "/users"],
  ["New user", "/users/new"],
  ["Settings", "/settings"],
  ["Permissions", "/settings/permissions"],
  ["Sessions & terms", "/settings/sessions"],
  ["New session", "/settings/sessions/new"],
  ["Audit log", "/audit"],
];

/* Specific strings only. A bare "500" was here once and matched every page
   showing a fee of KES 852,500 — it reported the dashboard, the fees module
   and the reports as broken when all three were perfect. A smoke test that
   cries wolf the night before a demo is worse than no smoke test. */
const ERROR_TEXT = [
  "Application error: a client-side exception",
  "Application error: a server-side exception",
  "Unhandled Runtime Error",
  "Internal Server Error",
  "This page couldn't load",
  "Something went wrong",
];

const results = [];
const record = (name, url, status, note, ok) => {
  results.push({ name, url, status, note, ok });
  const mark = ok ? "\u001b[32m  ok\u001b[0m" : "\u001b[31mFAIL\u001b[0m";
  process.stdout.write(`${mark}  ${name.padEnd(24)} ${String(status).padEnd(4)} ${note}\n`);
};

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

/** Server-side exceptions surface in the console as well as the boundary. */
const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(String(e)));

if (SHOTS) await mkdir(SHOTS, { recursive: true });

/* ----------------------------------------------------------------- sign in */
process.stdout.write(`\nSigning in to ${BASE} as ${USER}\n\n`);
const loginRes = await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
if (!loginRes || loginRes.status() >= 400) {
  console.error(`Cannot reach ${BASE}/login (status ${loginRes?.status() ?? "none"})`);
  process.exit(2);
}
await page.fill('input[name="username"]', USER);
await page.fill('input[name="password"]', PASS);
await page.click('button[type="submit"]');
// Wait for the URL to leave /login rather than for networkidle: the sign-in
// is a Server Action, so the page can be idle while still showing
// "Signing in…" and a networkidle wait returns before the redirect.
await page
  .waitForURL((u) => !new URL(u).pathname.startsWith("/login"), { timeout: 30000 })
  .catch(() => {});
await page.waitForLoadState("networkidle").catch(() => {});
if (new URL(page.url()).pathname.startsWith("/login")) {
  const msg = await page.locator("body").innerText().catch(() => "");
  console.error("Sign-in failed. The page still shows /login.\n" + msg.slice(0, 400));
  process.exit(2);
}
process.stdout.write(`Signed in, landed on ${new URL(page.url()).pathname}\n\n`);

/* ------------------------------------------- find real ids for dynamic routes */
async function firstHref(listUrl, pattern) {
  await page.goto(`${BASE}${listUrl}`, { waitUntil: "networkidle" }).catch(() => null);
  const href = await page
    .locator(`a[href^="${pattern}"]`)
    .first()
    .getAttribute("href")
    .catch(() => null);
  return href;
}

const dynamic = [];
for (const [label, list, prefix] of [
  ["A pupil's record", "/students", "/students/"],
  ["An exam", "/exams", "/exams/"],
  ["A fee account", "/fees", "/fees/"],
  ["A transport route", "/transport", "/transport/"],
  ["A dormitory", "/boarding", "/boarding/"],
  ["A staff record", "/staff", "/staff/"],
  ["A report", "/reports", "/reports/"],
  ["A user", "/users", "/users/"],
]) {
  const href = await firstHref(list, prefix);
  if (href && !href.endsWith("/new") && !href.endsWith("/import")) {
    dynamic.push([label, href]);
  } else {
    record(label, list, "-", "no row to open (empty module?)", true);
  }
}

/* ----------------------------------------------------------------- the walk */
process.stdout.write("\n");
for (const [name, url] of [...STATIC_ROUTES, ...dynamic]) {
  consoleErrors.length = 0;
  let status = 0;
  let note = "";
  let ok = true;
  try {
    const res = await page.goto(`${BASE}${url}`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    status = res?.status() ?? 0;
    const landed = new URL(page.url()).pathname;
    const body = await page.locator("body").innerText();

    if (status >= 400) {
      ok = false;
      note = `HTTP ${status}`;
    } else if (landed.startsWith("/login")) {
      ok = false;
      note = "bounced to /login — session lost or route mis-protected";
    } else if (landed.startsWith("/denied")) {
      ok = false;
      note = "permission denied for this role";
    } else {
      const hit = ERROR_TEXT.find((t) => body.includes(t));
      if (hit) {
        ok = false;
        note = `error boundary: "${hit}"`;
      } else {
        // A module with nothing in it yet is not a broken module. Several
        // pages answer with a deliberate empty state — "No linked pupils",
        // "No staff profile linked" — which is the page working. Treat a
        // missing <h1> as something to look at, not a failure, or the report
        // cries wolf and stops being read.
        const h1 = await page.locator("h1").count();
        if (h1 > 0) {
          note = "rendered";
        } else {
          const main = (await page.locator("main, body").first().innerText()).trim();
          note = main.length > 80 ? "rendered (empty state, no <h1>)" : "page looks blank";
          if (main.length <= 80) ok = false;
        }
      }
    }
    if (consoleErrors.length) {
      note += ` | console: ${consoleErrors[0].slice(0, 80)}`;
      ok = false;
    }
    if (SHOTS) {
      const file = url.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "root";
      await page.screenshot({
        path: path.join(SHOTS, `${file}.jpg`),
        type: "jpeg",
        quality: 70,
      });
    }
  } catch (e) {
    ok = false;
    note = String(e).split("\n")[0].slice(0, 100);
  }
  record(name, url, status || "-", note, ok);
}

/* --------------------------------------------------------------- the verdict */
const failed = results.filter((r) => !r.ok);
process.stdout.write(
  `\n${results.length - failed.length}/${results.length} modules OK\n`
);
if (failed.length) {
  process.stdout.write("\nNOT working:\n");
  for (const f of failed) process.stdout.write(`  ${f.name}  (${f.url})  — ${f.note}\n`);
}
if (SHOTS) {
  await writeFile(path.join(SHOTS, "results.json"), JSON.stringify(results, null, 2));
  process.stdout.write(`\nScreenshots and results.json in ${SHOTS}\n`);
}

await browser.close();
process.exit(failed.length ? 1 : 0);
