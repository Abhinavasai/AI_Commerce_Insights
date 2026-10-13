import { NextResponse } from "next/server";
import { getDemoDb, parseJson } from "@/lib/demo-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDemoDb();
  const rows = db
    .prepare(
      `SELECT s.*,
        (SELECT COUNT(*) FROM products p WHERE p.seller_id = s.id) AS product_count
       FROM sellers s ORDER BY s.name`
    )
    .all() as Record<string, unknown>[];
  return NextResponse.json(
    rows.map((r) => ({ ...r, meta: parseJson(r.meta, {}) }))
  );
}
