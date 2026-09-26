import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth gate (Next 16 "proxy", formerly middleware): requests with
 * no session cookie never reach protected pages. Real verification (JWT
 * signature + role permissions) happens server-side in layouts and actions.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/login";
  const hasSession = request.cookies.has("hc_session");

  if (!isPublic && !hasSession) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  if (isPublic && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|api/health|api/public|api/school/logo|.*\\.png$).*)"],
};
