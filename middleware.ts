import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/config";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

interface ProtectedRoute {
  prefix: string;
  role: "patient" | "dentist" | "admin";
  redirect: string;
}

const PROTECTED: ProtectedRoute[] = [
  { prefix: "/admin", role: "admin", redirect: "/unauthorized" },
  { prefix: "/dentist", role: "dentist", redirect: "/unauthorized" },
  { prefix: "/dashboard", role: "patient", redirect: "/unauthorized" },
];

async function resolveRole(request: NextRequest): Promise<string | null> {
  if (isDemoMode) {
    const payload = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    return payload?.role ?? null;
  }
  const { updateSession } = await import("@/lib/supabase/middleware");
  const { role } = await updateSession(request, NextResponse.next({ request }));
  return role;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth pages redirect signed-in users to their dashboard.
  if (pathname === "/login" || pathname === "/signup") {
    const role = await resolveRole(request);
    if (role) {
      const home = role === "admin" ? "/admin/dashboard" : role === "dentist" ? "/dentist/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.next();
  }

  const rule = PROTECTED.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (!rule) return NextResponse.next();

  const role = await resolveRole(request);
  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowed =
    rule.role === "patient" ? role === "patient" || role === "admin" : role === rule.role || role === "admin";
  if (!allowed) {
    return NextResponse.redirect(new URL(rule.redirect, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
