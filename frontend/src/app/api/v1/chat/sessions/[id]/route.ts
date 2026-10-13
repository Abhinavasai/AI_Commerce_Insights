import { NextResponse } from "next/server";
import { getDemoDb, parseJson } from "@/lib/demo-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const db = getDemoDb();
  const session = db
    .prepare(`SELECT * FROM chat_sessions WHERE id = ?`)
    .get(params.id) as Record<string, unknown> | undefined;
  if (!session) {
    return NextResponse.json({ detail: "Session not found" }, { status: 404 });
  }
  const messages = db
    .prepare(
      `SELECT * FROM chat_messages WHERE session_id = ? ORDER BY datetime(created_at)`
    )
    .all(params.id) as Record<string, unknown>[];
  return NextResponse.json({
    ...session,
    messages: messages.map((m) => ({
      ...m,
      meta: parseJson(m.meta, {}),
    })),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const db = getDemoDb();
  db.prepare(`DELETE FROM chat_messages WHERE session_id = ?`).run(params.id);
  db.prepare(`DELETE FROM chat_sessions WHERE id = ?`).run(params.id);
  return NextResponse.json({ ok: true });
}
