import Link from "next/link";

export default function DeniedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="font-display text-5xl font-extrabold text-ink-900">403</p>
      <p className="max-w-sm text-sm leading-relaxed">
        Your account doesn&rsquo;t have permission for that page. If you think it should,
        ask the school administrator.
      </p>
      <Link href="/" className="btn btn-primary">
        Back to dashboard
      </Link>
    </main>
  );
}
