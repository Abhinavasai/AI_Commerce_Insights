import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Demo stub — UI no longer requires login. */
export async function POST() {
  return NextResponse.json({
    access_token: "demo-access",
    refresh_token: "demo-refresh",
    token_type: "bearer",
  });
}
