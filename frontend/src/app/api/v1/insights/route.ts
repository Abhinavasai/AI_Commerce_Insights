import { NextRequest, NextResponse } from "next/server";
import { getDemoDb, parseJson } from "@/lib/demo-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getDemoDb();
  const type = req.nextUrl.searchParams.get("insight_type");
  const tag = req.nextUrl.searchParams.get("tag");
  let rows = db
    .prepare(`SELECT * FROM insights ORDER BY datetime(created_at) DESC`)
    .all() as Record<string, unknown>[];
  if (type) rows = rows.filter((r) => r.insight_type === type);
  const mapped = rows.map((r) => ({
    ...r,
    source_document_ids: parseJson(r.source_document_ids, [] as string[]),
    tags: parseJson(r.tags, [] as string[]),
  }));
  return NextResponse.json(
    tag ? mapped.filter((r) => (r.tags as string[]).includes(tag)) : mapped
  );
}
