import { NextRequest, NextResponse } from "next/server";
import { publicDemoCookieName, safeDemoNextPath } from "@/lib/supabase/config";

export function GET(request: NextRequest) {
  const destination = new URL(safeDemoNextPath(request.nextUrl.searchParams.get("next")), request.url);
  const response = NextResponse.redirect(destination);
  response.cookies.set(publicDemoCookieName, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
  return response;
}
