import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bootstrapIfEmpty } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

/** Deployment diagnostics: confirms DB connectivity and that accounts exist.
    Exposes counts only — no user data. Visiting it also self-heals an empty DB. */
export async function GET() {
  try {
    const seededNow = await bootstrapIfEmpty();
    const [users, permissions, auditEntries] = await Promise.all([
      db.user.count(),
      db.rolePermission.count(),
      db.auditLog.count(),
    ]);
    return NextResponse.json({
      status: "ok",
      database: "connected",
      users,
      permissions,
      auditEntries,
      seededJustNow: seededNow,
    });
  } catch (e) {
    return NextResponse.json(
      {
        status: "error",
        database: "unreachable or schema missing",
        detail: e instanceof Error ? e.message.slice(0, 300) : "unknown",
      },
      { status: 500 },
    );
  }
}
