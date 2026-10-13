import { randomUUID } from "crypto";
import { getDemoDb } from "@/lib/demo-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildAnswer(question: string, db: ReturnType<typeof getDemoDb>): string {
  const sellers = db
    .prepare(
      `SELECT s.name, COUNT(p.id) AS c FROM sellers s
       LEFT JOIN products p ON p.seller_id = s.id
       GROUP BY s.id ORDER BY c DESC LIMIT 5`
    )
    .all() as { name: string; c: number }[];
  const insights = db
    .prepare(
      `SELECT title, insight_type, confidence FROM insights ORDER BY confidence DESC LIMIT 3`
    )
    .all() as { title: string; insight_type: string; confidence: number }[];
  const docs = db
    .prepare(`SELECT title, status FROM documents ORDER BY datetime(created_at) DESC LIMIT 3`)
    .all() as { title: string; status: string }[];

  const sellerTable = sellers
    .map((s) => `| ${s.name} | ${s.c} |`)
    .join("\n");

  return [
    `**Commerce demo answer** (Vercel + SQLite)`,
    ``,
    `You asked: *${question}*`,
    ``,
    `### Top sellers by product count`,
    `| Seller | Products |`,
    `|---|---|`,
    sellerTable || `| — | 0 |`,
    ``,
    `### High-confidence insights`,
    ...insights.map(
      (i) =>
        `- **${i.title}** (${i.insight_type}, ${Math.round(i.confidence * 100)}%)`
    ),
    ``,
    `### Recent documents`,
    ...docs.map((d) => `- ${d.title} — \`${d.status}\``),
    ``,
    `_This response is grounded in the bundled demo database._`,
  ].join("\n");
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const db = getDemoDb();
  const body = (await req.json()) as { content?: string };
  const content = (body.content || "").trim();
  if (!content) {
    return new Response(JSON.stringify({ detail: "Empty message" }), {
      status: 400,
    });
  }

  const session = db
    .prepare(`SELECT id, title FROM chat_sessions WHERE id = ?`)
    .get(params.id) as { id: string; title: string } | undefined;
  if (!session) {
    return new Response(JSON.stringify({ detail: "Session not found" }), {
      status: 404,
    });
  }

  db.prepare(
    `INSERT INTO chat_messages (id, session_id, role, content, token_count, meta, created_at, updated_at)
     VALUES (?, ?, 'user', ?, ?, '{}', datetime('now'), datetime('now'))`
  ).run(randomUUID(), params.id, content, content.split(/\s+/).length);

  if (session.title === "New Chat") {
    db.prepare(
      `UPDATE chat_sessions SET title = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(content.slice(0, 60), params.id);
  } else {
    db.prepare(
      `UPDATE chat_sessions SET updated_at = datetime('now') WHERE id = ?`
    ).run(params.id);
  }

  const answer = buildAnswer(content, db);
  const assistantId = randomUUID();

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (obj: unknown) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      send({ event: "tool_call", data: { name: "catalog_lookup" } });
      send({
        event: "tool_result",
        data: { name: "catalog_lookup", result: { ok: true } },
      });
      send({ event: "tool_call", data: { name: "insight_search" } });
      send({
        event: "tool_result",
        data: { name: "insight_search", result: { ok: true } },
      });

      const words = answer.split(/(\s+)/);
      for (const w of words) {
        send({ event: "token", data: w });
      }
      send({ event: "done", data: {} });

      db.prepare(
        `INSERT INTO chat_messages (id, session_id, role, content, token_count, meta, created_at, updated_at)
         VALUES (?, ?, 'assistant', ?, ?, '{}', datetime('now'), datetime('now'))`
      ).run(assistantId, params.id, answer, answer.split(/\s+/).length);

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
