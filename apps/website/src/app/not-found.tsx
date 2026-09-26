import { ButtonLink } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-28 text-center md:py-40">
      <p className="kicker">Page not found</p>
      <h1 className="mt-4 font-display text-5xl font-extrabold text-ink-900 md:text-7xl">404</h1>
      <p className="mt-4 max-w-md text-lg leading-relaxed">
        We couldn&rsquo;t find that page. It may have moved — let&rsquo;s take you back home.
      </p>
      <div className="mt-8">
        <ButtonLink href="/">
          Back to home <ArrowRightIcon className="h-4 w-4" />
        </ButtonLink>
      </div>
    </div>
  );
}
