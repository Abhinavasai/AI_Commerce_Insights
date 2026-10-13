import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "vercel-demo-api",
    runtime_mode: "local",
    openai_configured: false,
    demo: true,
  });
}
