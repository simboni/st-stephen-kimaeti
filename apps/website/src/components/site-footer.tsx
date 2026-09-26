import Link from "next/link";
import Image from "next/image";
import { navLinks, school } from "@/lib/site";
import { MailIcon, PhoneIcon, PinIcon } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer className="bg-navy-900 text-white/75">
      <div className="container-page grid grid-cols-1 gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        {/* Identity */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 rounded-full bg-white object-contain"
            />
            <div>
              <p className="font-display text-lg font-extrabold text-white">
                Holy Cross Junior &amp; Infant Schools
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
                {school.motto}
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-md leading-relaxed">
            A faith-centred school in Bulimbo, Kakamega, shaping responsible citizens through
            quality education, discipline and service — from the Infant School through Junior
            School.
          </p>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-white">
            Quick Links
          </h3>
          <ul className="mt-5 space-y-2.5 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-brand-300">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/complain/" className="transition-colors hover:text-brand-300">
                Make a Complaint
              </Link>
            </li>
            <li>
              <Link href="/portal/" className="transition-colors hover:text-brand-300">
                Portal Login
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-white">
            Contact
          </h3>
          <ul className="mt-5 space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
              <a href={`mailto:${school.email}`} className="transition-colors hover:text-brand-300">
                {school.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
              <a href={`tel:${school.phoneHref}`} className="transition-colors hover:text-brand-300">
                {school.phone}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
              <span>{school.address}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-700">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {school.name}, Bulimbo. All rights reserved.
          </p>
          <p className="font-semibold text-brand-300/80">{school.motto}</p>
        </div>
      </div>
    </footer>
  );
}
