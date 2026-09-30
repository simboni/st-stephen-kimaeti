import Link from "next/link";
import { allLinks, contacts, payment, school } from "@/lib/site";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
import { Crest } from "@/components/crest";
import { MailIcon, PhoneIcon, PinIcon } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer className="bg-band text-band-text-2 no-print">
      <div className="container-page py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_2fr] lg:gap-20">
          {/* Identity */}
          <div>
            <div className="flex items-center gap-4">
              <Crest mark className="h-14 w-14 shrink-0" />
              <div>
                <p className="font-display text-xl text-band-text">
                  {school.name}
                </p>
                <p className="font-display text-sm italic text-band-accent">
                  {school.mottoLatin} — {school.motto}
                </p>
              </div>
            </div>
            <p className="mt-6 max-w-sm leading-relaxed">
              A mixed day and boarding school at Kimaeti in Bungoma County, sponsored by
              the {school.sponsor}, teaching 525 learners from Playgroup to Grade 9
              since {school.founded}.
            </p>

            <ul className="mt-7 space-y-3.5 text-sm">
              <li className="flex items-start gap-3">
                <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-band-accent" />
                <span className="flex flex-col gap-1">
                  {contacts.map((c) => (
                    <a
                      key={c.href}
                      href={`tel:${c.href}`}
                      className="transition-colors hover:text-band-text"
                    >
                      {c.phone}
                      <span className="ml-2 text-xs text-band-text-2/70">{c.role}</span>
                    </a>
                  ))}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-band-accent" />
                <a
                  href={`mailto:${school.email}`}
                  className="break-all transition-colors hover:text-band-text"
                >
                  {school.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-band-accent" />
                <span>
                  {school.address}
                  <br />
                  {school.ward}
                </span>
              </li>
            </ul>
          </div>

          {/* Sitemap + how to pay */}
          <div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {allLinks.map((group) => (
                <div key={group.heading}>
                  <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-band-text">
                    {group.heading}
                  </h2>
                  <ul className="mt-4 space-y-2.5 text-sm">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        {"file" in link && link.file ? (
                          // A generated file, not a route — plain <a>, so the
                          // client router does not try to render it as a page.
                          <a
                            href={`${base}${link.href}`}
                            className="transition-colors hover:text-band-accent"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            className="transition-colors hover:text-band-accent"
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-xl border border-band-line bg-band-2 p-5">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-band-accent">
                Paying fees
              </p>
              <p className="mt-2.5 text-sm leading-relaxed">
                M-PESA paybill{" "}
                <b className="font-semibold text-band-text">{payment.mpesa.paybill}</b>,
                account{" "}
                <b className="font-semibold text-band-text">{payment.accountFormat}</b> +
                your child&rsquo;s name, no spaces. Or {payment.bank.name} account{" "}
                <b className="font-semibold text-band-text">{payment.bank.account}</b>,{" "}
                {payment.bank.holder}.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-band-line">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs sm:flex-row">
          <p>
            © {new Date().getFullYear()} {school.name}.
          </p>
          <p className="font-display italic text-band-accent">
            {school.mottoLatin} — {school.motto}
          </p>
        </div>
      </div>
    </footer>
  );
}
