import { NextResponse } from "next/server";
import { getDemoDb, parseJson } from "@/lib/demo-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const db = getDemoDb();
  const doc = db
    .prepare(`SELECT * FROM documents WHERE id = ?`)
    .get(params.id) as Record<string, unknown> | undefined;
  if (!doc) {
    return NextResponse.json({ detail: "Document not found" }, { status: 404 });
  }
  const chunks = db
    .prepare(
      `SELECT id, chunk_index, substr(content, 1, 500) AS content, token_count
       FROM document_chunks WHERE document_id = ? ORDER BY chunk_index`
    )
    .all(params.id);
  return NextResponse.json({
    ...doc,
    meta: parseJson(doc.meta, {}),
    chunks,
  });
}
