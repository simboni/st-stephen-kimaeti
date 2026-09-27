"use client";

import { MoonIcon, SunIcon } from "@/components/icons";

/**
 * Flips <html data-theme> and remembers the choice.
 *
 * Deliberately stateless. The boot script has already put the right theme on
 * the document before first paint, and CSS swaps both the icon and the label
 * from that same attribute — so the control is correct in the instant before
 * hydration, and React never has to re-render to keep up.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const d = document.documentElement;
    const next = d.getAttribute("data-theme") === "dark" ? "light" : "dark";
    d.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private browsing — the choice simply will not persist */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-current transition-colors hover:bg-white/10 ${className}`}
    >
      <SunIcon className="hidden h-[18px] w-[18px] [[data-theme=dark]_&]:block" />
      <MoonIcon className="block h-[18px] w-[18px] [[data-theme=dark]_&]:hidden" />
      <span className="sr-only [[data-theme=dark]_&]:hidden">Switch to the dark theme</span>
      <span className="sr-only hidden [[data-theme=dark]_&]:inline">
        Switch to the light theme
      </span>
    </button>
  );
}
