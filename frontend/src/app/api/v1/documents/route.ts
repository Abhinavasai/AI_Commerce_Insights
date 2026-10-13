import { NextResponse } from "next/server";
import { getDemoDb, parseJson } from "@/lib/demo-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDemoDb();
  const rows = db
    .prepare(`SELECT * FROM documents ORDER BY datetime(created_at) DESC`)
    .all() as Record<string, unknown>[];
  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      meta: parseJson(r.meta, {}),
    }))
  );
}
