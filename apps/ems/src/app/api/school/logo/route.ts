import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Serves the uploaded school logo. Public — it appears on the login page. */
export async function GET() {
  const settings = await db.schoolSetting.findUnique({
    where: { id: "school" },
    select: { logo: true, logoType: true },
  });
  if (!settings?.logo || !settings.logoType) {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(new Uint8Array(settings.logo), {
    headers: {
      "Content-Type": settings.logoType,
      // Immutable per URL — the ?v= cache-buster changes when the logo does.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
