import type { Metadata } from "next";
import Image from "next/image";
import { getSchoolSettings, logoSrc } from "@/lib/school";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

// Renders per-request: it reads school settings (name, logo) from the
// database, which must never happen at build time — deploys build before
// migrations run, so the tables may not exist yet.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const school = await getSchoolSettings();
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-900 p-4">
      {/* soft brand glow */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(600px 400px at 20% 10%, rgba(255,87,34,0.18), transparent 60%), radial-gradient(500px 350px at 85% 90%, rgba(63,81,181,0.15), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="card overflow-hidden !rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center gap-2 bg-navy-950 px-8 pb-7 pt-8 text-center">
            <Image
              src={logoSrc(school)}
              alt=""
              width={72}
              height={72}
              unoptimized
              className="h-18 w-18 rounded-full bg-white object-contain"
              priority
            />
            <h1 className="mt-2 font-display text-lg font-extrabold text-white">{school.name}</h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-300">
              School Management System
            </p>
          </div>
          <div className="px-8 py-8">
            <LoginForm />
          </div>
        </div>
        <p className="mt-5 text-center text-xs text-white/50">
          Trouble signing in? Contact the school office{school.phone ? ` · ${school.phone}` : ""}
        </p>
      </div>
    </main>
  );
}
