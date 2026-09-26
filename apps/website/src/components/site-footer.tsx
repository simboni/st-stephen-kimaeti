import Link from "next/link";
import { navLinks, payment, school } from "@/lib/site";
import { Crest } from "@/components/crest";
import { MailIcon, PhoneIcon, PinIcon } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer className="bg-navy-900 text-white/75">
      <div className="container-page grid grid-cols-1 gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        {/* Identity */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <Crest className="h-14 w-14 shrink-0" />
            <div>
              <p className="font-display text-lg font-extrabold leading-tight text-white">
                St Stephen&rsquo;s, Kimaeti
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
                {school.motto}
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-md leading-relaxed">
            A mixed day and boarding school at Kimaeti in Bungoma County, sponsored by
            the {school.sponsor} and teaching 525 learners from Playgroup to Grade 9
            since {school.founded}.
          </p>

          <div className="mt-6 rounded-xl border border-navy-600 bg-navy-800/60 p-4 text-sm">
            <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-brand-300">
              Paying fees
            </p>
            <p className="mt-2 leading-relaxed">
              M-PESA paybill <b className="text-white">{payment.mpesa.paybill}</b>, account{" "}
              <b className="text-white">{payment.accountFormat}</b> + your child&rsquo;s name,
              no spaces. Or {payment.bank.name} account{" "}
              <b className="text-white">{payment.bank.account}</b>.
            </p>
          </div>
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
                Parents&rsquo; Portal
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
              <a
                href={`mailto:${school.email}`}
                className="break-all transition-colors hover:text-brand-300"
              >
                {school.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
              <span className="flex flex-col gap-1">
                <a href={`tel:${school.phoneHref}`} className="transition-colors hover:text-brand-300">
                  {school.phone}
                </a>
                <a
                  href={`tel:${school.phoneAltHref}`}
                  className="transition-colors hover:text-brand-300"
                >
                  {school.phoneAlt}
                </a>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
              <span>
                {school.address}
                <br />
                {school.ward}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-700">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {school.name}. All rights reserved.
          </p>
          <p className="font-semibold text-brand-300/80">{school.motto}</p>
        </div>
      </div>
    </footer>
  );
}
