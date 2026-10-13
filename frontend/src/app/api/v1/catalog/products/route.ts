import { NextResponse } from "next/server";
import { getDemoDb, parseJson } from "@/lib/demo-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDemoDb();
  const rows = db
    .prepare(
      `SELECT p.*, s.name AS seller_name, c.name AS category_name
       FROM products p
       LEFT JOIN sellers s ON s.id = p.seller_id
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.name`
    )
    .all() as Record<string, unknown>[];
  return NextResponse.json(
    rows.map((r) => ({ ...r, attributes: parseJson(r.attributes, {}) }))
  );
}
