"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { bootstrapIfEmpty } from "@/lib/bootstrap";
import { createSession, destroySession, getSession, clientIp } from "@/lib/auth";

/* Simple per-IP throttle: 10 failed attempts / 10 minutes. In-memory is fine
   for a single-instance deployment; revisit if we ever scale out. */
const failures = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 10;

function throttled(ip: string) {
  const entry = failures.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(ip: string) {
  const entry = failures.get(ip);
  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    failures.set(ip, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Enter your username and password." };

  const ip = await clientIp();
  if (throttled(ip)) {
    return { error: "Too many failed attempts. Please wait a few minutes and try again." };
  }

  let user;
  try {
    // Self-heal: a completely empty user table gets the demo accounts.
    await bootstrapIfEmpty();
    user = await db.user.findUnique({ where: { username } });
  } catch (e) {
    console.error("login: database error", e);
    return {
      error: `System error reaching the database — tell the developer: ${
        e instanceof Error ? e.message.slice(0, 200) : "unknown error"
      }`,
    };
  }
  const valid = user && (await bcrypt.compare(password, user.passwordHash));

  if (!user || !valid) {
    recordFailure(ip);
    await audit({ username }, "auth", "login_failed", "Wrong username or password");
    return { error: "Wrong username or password." };
  }
  if (!user.active) {
    await audit(user, "auth", "login_blocked", "Account is disabled");
    return { error: "This account has been disabled. Contact the school office." };
  }

  failures.delete(ip);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession({ id: user.id, username: user.username, name: user.name, role: user.role });
  await audit(user, "auth", "login", `Signed in as ${user.role}`);
  redirect("/");
}

export async function logout() {
  const session = await getSession();
  if (session) await audit(session, "auth", "logout");
  await destroySession();
  redirect("/login");
}
