import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { hasSupabaseConfig, requireSupabaseEnv } from "@/lib/env";
import { safeNextPath } from "@/lib/env";

const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/auth",
  "/invite",
  "/manifest.webmanifest",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => prefix !== "/" && pathname.startsWith(prefix),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!hasSupabaseConfig()) {
    return supabaseResponse;
  }

  const { url, key } = requireSupabaseEnv();

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([headerKey, headerValue]) => {
          supabaseResponse.headers.set(headerKey, headerValue);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const inviteMatch = pathname.match(/^\/invite\/([^/]+)$/);
  if (inviteMatch?.[1]) {
    supabaseResponse.cookies.set("here_invite_token", inviteMatch[1], {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
  }

  if (!user && (pathname.startsWith("/app") || pathname.startsWith("/onboarding"))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    const next = `${pathname}${search}`;
    redirectUrl.searchParams.set("next", safeNextPath(next, "/app/today"));
    if (inviteMatch?.[1]) {
      redirectUrl.searchParams.set("invite", inviteMatch[1]);
    }
    const redirect = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  if (user && pathname === "/login") {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = next;
    redirectUrl.search = "";
    const redirect = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    const redirect = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  return supabaseResponse;
}
