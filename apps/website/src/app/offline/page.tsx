import type { Metadata } from "next";
import { school } from "@/lib/site";
import { Crest } from "@/components/crest";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "You are offline",
  robots: { index: false, follow: false },
};

/** What the service worker serves when a page is requested with no network and
 *  nothing cached for it. Everything already visited still opens normally. */
export default function OfflinePage() {
  return (
    <div className="container-page flex flex-col items-center py-28 text-center md:py-40">
      <Crest mark className="h-16 w-16" />
      <p className="eyebrow mt-8 justify-center">No connection</p>
      <h1 className="display mt-4 text-[2.2rem] md:text-[3rem]">
        You are offline
      </h1>
      <p className="lede mt-5 max-w-lg">
        This page has not been saved to your phone yet. Pages you have already opened —
        the fee structure, admissions, term dates — still work without a signal.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Back to the home page</ButtonLink>
        <ButtonLink href={`tel:${school.phoneHref}`} variant="outline" external>
          Call the school
        </ButtonLink>
      </div>
    </div>
  );
}
