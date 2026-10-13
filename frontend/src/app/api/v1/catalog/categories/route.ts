import { NextResponse } from "next/server";
import { getDemoDb } from "@/lib/demo-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDemoDb();
  const rows = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
       FROM categories c ORDER BY c.name`
    )
    .all();
  return NextResponse.json(rows);
}
