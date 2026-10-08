"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navigation on a phone.
 *
 * What this replaces, and why. The mobile nav used to be a single horizontal
 * strip holding every destination the role could see. Measured on a 390px
 * screen with an administrator signed in: 29 links, 3352px wide — **8.6
 * screenfuls of sideways scrolling** to reach Audit Trail, with no grouping,
 * no active state, and nothing on screen to suggest the other 26 existed. The
 * pills were 28px tall, well under the 44px minimum for a touch target.
 *
 * What it does instead:
 *
 * · Four destinations live in a fixed bottom bar, within thumb reach, chosen
 *   per role from the modules that role can actually see. Everything else is
 *   behind "More".
 * · "More" opens a full-height sheet carrying the same groups as the desktop
 *   sidebar, so the two navigations teach the same shape of the system.
 * · The sheet opens with a filter box. Twenty-nine destinations is too many to
 *   scan; typing "fee" is faster than any menu. On a phone the keyboard is not
 *   raised automatically — that would bury the list it is meant to search.
 * · Everything is at least 44px tall.
 *
 * The bar is hidden from `lg` up, where the sidebar takes over.
 */

export type MobileNavItem = { href: string; label: string; group: string | null };

/** Is this link the one the current page belongs to? Longest match wins, so
 *  /students/new highlights Students rather than also matching Dashboard. */
function useActiveHref(items: { href: string }[]) {
  const pathname = usePathname();
  return useMemo(() => {
    let best = "";
    for (const { href } of items) {
      if (href === "/" ? pathname === "/" : pathname.startsWith(href)) {
        if (href.length > best.length) best = href;
      }
    }
    return best;
  }, [pathname, items]);
}

export function MobileNav({
  primary,
  all,
}: {
  primary: MobileNavItem[];
  all: MobileNavItem[];
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const pathname = usePathname();
  const activeHref = useActiveHref(all);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on navigation. Without this the sheet stays over the page the user
  // just asked for, which reads as a broken tap.
  useEffect(() => {
    setOpen(false);
    setQ("");
  }, [pathname]);

  // While the sheet is up, the page behind it must not scroll — otherwise
  // flicking the list drags the page and the sheet appears stuck.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const needle = q.trim().toLowerCase();
  const groups = useMemo(() => {
    const out: { label: string | null; items: MobileNavItem[] }[] = [];
    for (const item of all) {
      if (needle && !item.label.toLowerCase().includes(needle)) continue;
      const last = out[out.length - 1];
      if (last && last.label === item.group) last.items.push(item);
      else out.push({ label: item.group, items: [item] });
    }
    return out;
  }, [all, needle]);

  const primaryActive = primary.some((p) => p.href === activeHref);

  return (
    <>
      {/* ---------------------------------------------------------- sheet -- */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col lg:hidden">
          <button
            type="button"
            aria-label="Close the menu"
            onClick={() => setOpen(false)}
            className="flex-1 bg-ink-900/40 backdrop-blur-[2px]"
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="All sections"
            className="flex max-h-[85vh] flex-col rounded-t-2xl bg-paper-50 shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-paper-300 px-4 py-3">
              {/* The grab handle people expect on a sheet. */}
              <span aria-hidden className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-paper-300" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search sections…"
                aria-label="Search sections"
                className="field !mt-0 flex-1"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-secondary !min-h-11 !px-3"
              >
                Close
              </button>
            </div>

            <nav aria-label="All sections" className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
              {groups.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-ink-500">
                  Nothing matches “{q}”.
                </p>
              )}
              {groups.map((g, i) => (
                <div key={`${g.label ?? "top"}-${i}`} className={i > 0 ? "mt-4" : ""}>
                  {g.label && (
                    <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">
                      {g.label}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {g.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={item.href === activeHref ? "page" : undefined}
                        className={`flex min-h-11 items-center rounded-xl px-3 text-[15px] font-semibold ${
                          item.href === activeHref
                            ? "bg-brand-50 text-brand-700"
                            : "text-ink-800 active:bg-paper-200"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- bottom bar -- */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-paper-300 bg-paper-50/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5">
          {primary.map((item) => {
            const active = item.href === activeHref;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-bold leading-tight ${
                    active ? "text-brand-700" : "text-ink-500"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`h-0.5 w-6 rounded-full ${active ? "bg-brand-600" : "bg-transparent"}`}
                  />
                  <span className="text-center">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-haspopup="dialog"
              className={`flex min-h-[3.25rem] w-full flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-bold leading-tight ${
                open || !primaryActive ? "text-brand-700" : "text-ink-500"
              }`}
            >
              <span
                aria-hidden
                className={`h-0.5 w-6 rounded-full ${
                  open || !primaryActive ? "bg-brand-600" : "bg-transparent"
                }`}
              />
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
