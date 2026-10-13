import { NextResponse } from "next/server";
import { getDemoDb, parseJson } from "@/lib/demo-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const db = getDemoDb();
  const row = db
    .prepare(`SELECT * FROM insights WHERE id = ?`)
    .get(params.id) as Record<string, unknown> | undefined;
  if (!row) {
    return NextResponse.json({ detail: "Insight not found" }, { status: 404 });
  }
  return NextResponse.json({
    ...row,
    source_document_ids: parseJson(row.source_document_ids, [] as string[]),
    tags: parseJson(row.tags, [] as string[]),
  });
}
