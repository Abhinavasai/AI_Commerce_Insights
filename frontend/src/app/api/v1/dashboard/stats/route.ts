import { NextResponse } from "next/server";
import { getDemoDb } from "@/lib/demo-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDemoDb();
  const count = (table: string, where = "") =>
    (
      db
        .prepare(`SELECT COUNT(*) AS c FROM ${table} ${where}`)
        .get() as { c: number }
    ).c;

  const statusRows = db
    .prepare(
      `SELECT status, COUNT(*) AS c FROM documents GROUP BY status`
    )
    .all() as { status: string; c: number }[];
  const document_status = {
    completed: 0,
    pending: 0,
    processing: 0,
    failed: 0,
    ...Object.fromEntries(statusRows.map((r) => [r.status, r.c])),
  };

  const typeRows = db
    .prepare(
      `SELECT insight_type, COUNT(*) AS c FROM insights GROUP BY insight_type`
    )
    .all() as { insight_type: string; c: number }[];
  const insights_by_type = Object.fromEntries(
    typeRows.map((r) => [r.insight_type, r.c])
  );

  const recent_documents = db
    .prepare(
      `SELECT id, title, status FROM documents ORDER BY datetime(created_at) DESC LIMIT 5`
    )
    .all();
  const recent_insights = db
    .prepare(
      `SELECT id, title, insight_type, confidence FROM insights ORDER BY datetime(created_at) DESC LIMIT 5`
    )
    .all();

  return NextResponse.json({
    runtime_mode: "local",
    totals: {
      documents: count("documents"),
      insights: count("insights"),
      chat_sessions: count("chat_sessions"),
      products: count("products"),
      sellers: count("sellers"),
      categories: count("categories"),
    },
    document_status,
    insights_by_type,
    recent_documents,
    recent_insights,
  });
}
