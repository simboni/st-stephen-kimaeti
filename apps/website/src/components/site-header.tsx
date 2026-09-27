"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { allLinks, navLinks, school } from "@/lib/site";
import { Crest } from "@/components/crest";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowRightIcon,
  CloseIcon,
  MailIcon,
  MenuIcon,
  PhoneIcon,
  UserIcon,
} from "@/components/icons";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href.replace(/\/$/, ""));
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Tell the boot script's observer to re-scan after a client-side navigation
  // has swapped the DOM. The solid-on-scroll styling is handled there too, as
  // a class on <html>, so this component never re-renders while scrolling.
  useEffect(() => {
    document.dispatchEvent(new Event("ststephen:navigated"));
  }, [pathname]);

  // The open menu owns the screen: stop the page behind it from scrolling.
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

  return (
    <header className="sticky top-0 z-50 no-print">
      {/* Contact strip — always dark, above the bar */}
      <div className="bg-band text-band-text-2">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-xs">
          <div className="flex min-w-0 items-center gap-5">
            <a
              href={`mailto:${school.email}`}
              className="inline-flex items-center gap-1.5 truncate transition-colors hover:text-band-text"
            >
              <MailIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden truncate sm:inline">{school.email}</span>
              <span className="sm:hidden">Email</span>
            </a>
            <a
              href={`tel:${school.phoneHref}`}
              className="inline-flex shrink-0 items-center gap-1.5 transition-colors hover:text-band-text"
            >
              <PhoneIcon className="h-3.5 w-3.5" />
              {school.phone}
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle className="!h-7 !w-7 text-band-text-2 hover:text-band-text" />
            <Link
              href="/portal/"
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-semibold text-band-accent transition-colors hover:text-band-text"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Parents&rsquo; portal</span>
              <span className="sm:hidden">Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="header-bar">
        <div className="container-page flex h-[4.25rem] items-center justify-between gap-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Crest mark className="h-10 w-10 shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block font-display text-[15px] font-semibold tracking-tight text-text sm:text-[17px]">
                St Stephen&rsquo;s, Kimaeti
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-text-3">
                {school.mottoLatin} · Pray and Work
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-full px-3 py-2 text-[13.5px] font-semibold transition-colors ${
                    active ? "text-accent" : "text-text-2 hover:text-text"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
            <Link
              href="/admissions/"
              className="btn btn-primary ml-3 !px-5 !py-2.5 !text-[13.5px]"
            >
              Apply
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-text lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Open the menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Full-screen mobile menu */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="fixed inset-0 z-50 flex flex-col bg-surface lg:hidden"
      >
        <div className="flex h-[4.25rem] shrink-0 items-center justify-between border-b border-line px-5">
          <span className="flex items-center gap-3">
            <Crest mark className="h-9 w-9" />
            <span className="font-display text-[15px] font-semibold text-text">
              St Stephen&rsquo;s
            </span>
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-text"
            aria-label="Close the menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-7" aria-label="Site">
          {allLinks.map((group) => (
            <div key={group.heading} className="mb-8">
              <p className="eyebrow mb-3">{group.heading}</p>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href} className="border-b border-line last:border-0">
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block py-3.5 font-display text-2xl text-text"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line p-5">
          <Link
            href="/admissions/"
            onClick={() => setOpen(false)}
            className="btn btn-primary w-full"
          >
            Apply for a place
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <a
            href={`tel:${school.phoneHref}`}
            className="btn btn-outline mt-2.5 w-full"
          >
            <PhoneIcon className="h-4 w-4" />
            {school.phone}
          </a>
        </div>
      </div>
    </header>
  );
}
