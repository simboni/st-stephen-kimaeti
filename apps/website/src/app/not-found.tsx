import { Crest } from "@/components/crest";
import { ButtonLink } from "@/components/ui";
import { allLinks } from "@/lib/site";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 md:py-36">
      <div className="mx-auto max-w-2xl text-center">
        <Crest mark className="mx-auto h-16 w-16" />
        <p className="eyebrow mt-8 justify-center">Page not found</p>
        <h1 className="display mt-4 text-[3rem] md:text-[4.5rem]">404</h1>
        <p className="lede mt-5">
          We could not find that page. It may have moved — here is everything else.
        </p>
        <div className="mt-9">
          <ButtonLink href="/">Back to the home page</ButtonLink>
        </div>
      </div>

      <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-8 border-t border-line pt-10 sm:grid-cols-3">
        {allLinks.map((group) => (
          <div key={group.heading}>
            <p className="eyebrow">{group.heading}</p>
            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  {"file" in link && link.file ? (
                    <a
                      href={`${base}${link.href}`}
                      className="link-underline !font-normal !no-underline hover:!underline"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="link-underline !font-normal !no-underline hover:!underline"
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
    </div>
  );
}
