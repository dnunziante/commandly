import { NextResponse } from "next/server";
import { publicDemoCookieName } from "@/lib/supabase/config";

export async function POST() {
  const response = NextResponse.json({ cleared: true });
  response.cookies.set(publicDemoCookieName, "", { path: "/", maxAge: 0 });
  return response;
}
