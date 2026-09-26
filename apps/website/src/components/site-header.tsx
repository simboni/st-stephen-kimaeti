"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navLinks, school } from "@/lib/site";
import { CloseIcon, MailIcon, MenuIcon, PhoneIcon, UserIcon } from "@/components/icons";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href.replace(/\/$/, ""));
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Top contact strip */}
      <div className="bg-navy-900 text-white/85">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <div className="flex items-center gap-5">
            <a
              href={`mailto:${school.email}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <MailIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{school.email}</span>
              <span className="sm:hidden">Email us</span>
            </a>
            <a
              href={`tel:${school.phoneHref}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <PhoneIcon className="h-3.5 w-3.5" />
              {school.phone}
            </a>
          </div>
          <Link
            href="/portal/"
            className="inline-flex items-center gap-1.5 font-semibold text-brand-300 transition-colors hover:text-brand-200"
          >
            <UserIcon className="h-3.5 w-3.5" />
            Portal Login
          </Link>
        </div>
      </div>

      {/* Main navigation */}
      <div className="border-b border-paper-300 bg-paper-50/95 backdrop-blur">
        <div className="container-page flex h-[4.5rem] items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Image
              src="/logo.png"
              alt={`${school.name} logo`}
              width={52}
              height={52}
              className="h-11 w-11 shrink-0 rounded-full bg-white object-contain sm:h-13 sm:w-13"
              priority
            />
            <span className="min-w-0">
              <span className="block font-display text-[13px] font-extrabold leading-[1.15] text-ink-900 sm:text-base">
                Holy Cross Junior &amp; Infant Schools
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-600 sm:text-[11px] sm:tracking-[0.18em]">
                Bulimbo<span className="hidden sm:inline"> · {school.motto}</span>
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isActive(pathname, link.href)
                    ? "bg-brand-50 text-brand-600"
                    : "text-ink-700 hover:bg-paper-200 hover:text-ink-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-paper-300 text-ink-900 lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <nav className="border-t border-paper-300 bg-paper-50 lg:hidden" aria-label="Mobile">
            <div className="container-page flex flex-col gap-1 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                    isActive(pathname, link.href)
                      ? "bg-brand-50 text-brand-600"
                      : "text-ink-700 hover:bg-paper-200"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/portal/"
                onClick={closeMenu}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-4 py-3 text-sm font-bold text-white"
              >
                <UserIcon className="h-4 w-4" />
                Portal Login
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
