/* Accessibility and compatibility audit of the exported site.

   For every page, in light and dark, at phone and desktop width:
     · axe-core, WCAG 2.2 A + AA rules
     · every interactive element is reachable and visibly focusable
     · one <h1>, headings in order
     · no horizontal overflow at 320px
     · every <img> has an alt attribute

   Exits non-zero if anything fails, so it can gate a deploy.

   Run:  cd apps/website && npm run build
         node tools/a11y.mjs

   Needs playwright-core and axe-core. They are not in the site's own
   dependencies on purpose — this is a check we run, not something the site
   ships — so install them wherever you run it from.                            */

import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");
const AXE = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = process.env.SITE_OUT ?? path.resolve(HERE, "../apps/website/out");
const PAGES = [
  "/",
  "/about/",
  "/academics/",
  "/school-life/",
  "/admissions/",
  "/fees/",
  "/gallery/",
  "/news/",
  "/news/science-and-engineering-fair/",
  "/events/",
  "/contact/",
  "/complain/",
  "/portal/",
  "/offline/",
];

const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
  ".ics": "text/calendar",
  ".txt": "text/plain",
};

const server = createServer(async (req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  try {
    if ((await stat(p)).isDirectory()) p = path.join(p, "index.html");
  } catch {
    if (!path.extname(p)) p += ".html";
  }
  try {
    const body = await readFile(p);
    res.writeHead(200, {
      "content-type": TYPES[path.extname(p)] ?? "application/octet-stream",
    });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
});
await new Promise((r) => server.listen(4500, r));

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const problems = [];
const note = (where, what) => problems.push(`${where}  ${what}`);

for (const theme of ["light", "dark"]) {
  for (const [label, width, height] of [
    ["phone", 320, 720],
    ["desktop", 1440, 900],
  ]) {
    const ctx = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
      colorScheme: theme,
    });
    // Make the theme deterministic rather than relying on the media query.
    await ctx.addInitScript(`try { localStorage.setItem("theme", "${theme}") } catch (e) {}`);

    for (const route of PAGES) {
      const page = await ctx.newPage();
      const where = `${route} [${theme}/${label}]`;
      await page.goto(`http://127.0.0.1:4500${route}`, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        for (const img of document.images) img.loading = "eager";
      });
      await page
        .waitForFunction(
          () => Array.from(document.images).every((i) => i.complete),
          null,
          { timeout: 20000 },
        )
        .catch(() => {});

      // --- axe ---------------------------------------------------------------
      await page.addScriptTag({ content: AXE });
      const axeResult = await page.evaluate(async () => {
        // @ts-expect-error injected
        return await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
          resultTypes: ["violations"],
        });
      });
      for (const v of axeResult.violations) {
        note(
          where,
          `axe ${v.impact}: ${v.id} — ${v.help} (${v.nodes.length}) :: ${v.nodes[0]?.target?.join(" ")}`,
        );
      }

      // --- headings ----------------------------------------------------------
      const headings = await page.evaluate(() =>
        Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((h) => ({
          level: Number(h.tagName[1]),
          text: (h.textContent || "").trim().slice(0, 40),
        })),
      );
      const h1s = headings.filter((h) => h.level === 1).length;
      if (h1s !== 1) note(where, `has ${h1s} <h1> elements, expected exactly 1`);
      for (let i = 1; i < headings.length; i += 1) {
        if (headings[i].level - headings[i - 1].level > 1) {
          note(
            where,
            `heading jumps h${headings[i - 1].level} → h${headings[i].level} at "${headings[i].text}"`,
          );
        }
      }

      // --- alt text ----------------------------------------------------------
      const noAlt = await page.evaluate(
        () => Array.from(document.images).filter((i) => !i.hasAttribute("alt")).length,
      );
      if (noAlt) note(where, `${noAlt} <img> without an alt attribute`);

      // --- horizontal overflow ----------------------------------------------
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 1) note(where, `page scrolls horizontally by ${overflow}px`);

      // --- keyboard focus ----------------------------------------------------
      if (label === "desktop") {
        const focus = await page.evaluate(() => {
          const targets = Array.from(
            document.querySelectorAll(
              'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return (
              r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"
            );
          });
          const bad = [];
          for (const el of targets) {
            el.focus();
            if (document.activeElement !== el) {
              bad.push(`unfocusable: ${el.tagName}.${el.className}`.slice(0, 80));
              continue;
            }
            const cs = getComputedStyle(el);
            const outline =
              cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
            const ring = cs.boxShadow !== "none";
            if (!outline && !ring) {
              bad.push(`no focus ring: ${el.tagName} "${(el.textContent || "").trim().slice(0, 28)}"`);
            }
          }
          return { count: targets.length, bad };
        });
        if (focus.count === 0) note(where, "no focusable elements found at all");
        for (const b of focus.bad.slice(0, 4)) note(where, b);
      }

      await page.close();
    }
    await ctx.close();
  }
}

await browser.close();
server.close();

if (problems.length === 0) {
  console.log(`PASS — ${PAGES.length} pages × 2 themes × 2 widths, nothing found.`);
} else {
  const unique = [...new Set(problems)];
  console.log(`${unique.length} problem(s):\n`);
  for (const p of unique) console.log("  " + p);
  process.exitCode = 1;
}
