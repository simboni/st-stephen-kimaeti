import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Public inbox for the school website: the contact form posts ENQUIRY,
 * the complaint form posts COMPLAINT. No auth — protected instead by a
 * per-IP rate limit, a honeypot field, and strict validation.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many messages — please try again later." },
      { status: 429, headers: CORS },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400, headers: CORS });
  }

  const str = (v: unknown, max: number) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";

  const kind = str(body.kind, 20).toUpperCase();
  const name = str(body.name, 120);
  const email = str(body.email, 160);
  const phone = str(body.phone, 40);
  const subject = str(body.subject, 120);
  const message = str(body.message, 4000);
  const honeypot = str(body.website, 200); // bots fill this; humans never see it

  if (honeypot) return NextResponse.json({ ok: true }, { headers: CORS }); // silently drop
  if (kind !== "ENQUIRY" && kind !== "COMPLAINT")
    return NextResponse.json({ ok: false, error: "Unknown message type." }, { status: 400, headers: CORS });
  if (name.length < 2)
    return NextResponse.json({ ok: false, error: "Please give your name." }, { status: 400, headers: CORS });
  if (message.length < 10)
    return NextResponse.json({ ok: false, error: "Please give a little more detail." }, { status: 400, headers: CORS });

  try {
    if (kind === "COMPLAINT") {
      await db.complaint.create({
        data: {
          name,
          phone: phone || null,
          email: email || null,
          subject: subject || null,
          message,
          source: "WEBSITE",
        },
      });
    } else {
      await db.enquiry.create({
        data: {
          name,
          phone: phone || null,
          email: email || null,
          subject: subject || null,
          message,
          source: "WEBSITE",
        },
      });
    }
    await db.auditLog.create({
      data: {
        username: "website",
        action: kind === "COMPLAINT" ? "website_complaint_received" : "website_enquiry_received",
        module: "frontoffice",
        detail: `${name}${subject ? ` · ${subject}` : ""}`,
        ip,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not save your message — please try again." },
      { status: 500, headers: CORS },
    );
  }

  return NextResponse.json({ ok: true }, { headers: CORS });
}
