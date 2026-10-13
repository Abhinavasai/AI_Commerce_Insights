import { NextResponse } from "next/server";
import { getDemoDb } from "@/lib/demo-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDemoDb();
  const user =
    db
      .prepare(
        `SELECT id, email, full_name, role, is_active FROM users WHERE email = ? LIMIT 1`
      )
      .get("analyst@demo.com") ||
    db
      .prepare(
        `SELECT id, email, full_name, role, is_active FROM users ORDER BY created_at LIMIT 1`
      )
      .get();

  if (!user) {
    return NextResponse.json(
      {
        id: "demo",
        email: "analyst@demo.com",
        full_name: "Demo Analyst",
        role: "analyst",
        is_active: true,
      },
      { status: 200 }
    );
  }
  return NextResponse.json(user);
}
