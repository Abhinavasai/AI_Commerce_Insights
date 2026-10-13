import { NextResponse } from "next/server";
import { getDemoDb } from "@/lib/demo-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDemoDb();
  const products = db
    .prepare(`SELECT id, name, seller_id, category_id FROM products LIMIT 80`)
    .all() as {
    id: string;
    name: string;
    seller_id: string | null;
    category_id: string | null;
  }[];
  const sellers = db.prepare(`SELECT id, name FROM sellers`).all() as {
    id: string;
    name: string;
  }[];
  const categories = db.prepare(`SELECT id, name FROM categories`).all() as {
    id: string;
    name: string;
  }[];
  const links = db
    .prepare(
      `SELECT source_id, target_id, rel_type FROM entity_links LIMIT 200`
    )
    .all() as { source_id: string; target_id: string; rel_type: string }[];

  const nodes = [
    ...sellers.map((s) => ({ id: s.id, label: s.name, type: "seller" })),
    ...categories.map((c) => ({ id: c.id, label: c.name, type: "category" })),
    ...products.map((p) => ({ id: p.id, label: p.name, type: "product" })),
  ];
  const edges = [
    ...products
      .filter((p) => p.seller_id)
      .map((p) => ({ source: p.seller_id!, target: p.id, rel: "SELLS" })),
    ...products
      .filter((p) => p.category_id)
      .map((p) => ({
        source: p.id,
        target: p.category_id!,
        rel: "BELONGS_TO",
      })),
    ...links.map((l) => ({
      source: l.source_id,
      target: l.target_id,
      rel: l.rel_type,
    })),
  ];

  const count = (t: string) =>
    (db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get() as { c: number }).c;

  return NextResponse.json({
    nodes,
    edges,
    summary: {
      products: count("products"),
      sellers: count("sellers"),
      categories: count("categories"),
      relationships: count("entity_links"),
    },
  });
}
