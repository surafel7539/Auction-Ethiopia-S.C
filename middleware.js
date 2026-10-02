import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const protectedPaths = ["/sell", "/dashboard"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const needsAuth = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!needsAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/sell", "/sell/:path*", "/dashboard", "/dashboard/:path*"],
};
