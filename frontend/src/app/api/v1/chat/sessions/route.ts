import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDemoDb } from "@/lib/demo-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function demoUserId(db: ReturnType<typeof getDemoDb>): string {
  const u = db
    .prepare(`SELECT id FROM users WHERE email = ?`)
    .get("analyst@demo.com") as { id: string } | undefined;
  return u?.id || "demo";
}

export async function GET() {
  const db = getDemoDb();
  const uid = demoUserId(db);
  const rows = db
    .prepare(
      `SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY datetime(updated_at) DESC`
    )
    .all(uid);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const db = getDemoDb();
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const id = randomUUID();
  const uid = demoUserId(db);
  const title = body.title || "New Chat";
  db.prepare(
    `INSERT INTO chat_sessions (id, title, user_id, created_at, updated_at)
     VALUES (?, ?, ?, datetime('now'), datetime('now'))`
  ).run(id, title, uid);
  const row = db.prepare(`SELECT * FROM chat_sessions WHERE id = ?`).get(id);
  return NextResponse.json(row);
}
