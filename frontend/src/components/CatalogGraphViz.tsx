"use client";

import { useMemo } from "react";
import type { CatalogGraph } from "@/lib/types";

const typeColor: Record<string, string> = {
  seller: "#0f766e",
  category: "#0369a1",
  product: "#64748b",
};

export function CatalogGraphViz({ graph }: { graph: CatalogGraph }) {
  const layout = useMemo(() => {
    const sellers = graph.nodes.filter((n) => n.type === "seller");
    const categories = graph.nodes.filter((n) => n.type === "category");
    const products = graph.nodes.filter((n) => n.type === "product").slice(0, 24);
    const shown = new Set([
      ...sellers.map((n) => n.id),
      ...categories.map((n) => n.id),
      ...products.map((n) => n.id),
    ]);
    const edges = graph.edges.filter(
      (e) => shown.has(e.source) && shown.has(e.target)
    );

    const positions = new Map<string, { x: number; y: number }>();
    const w = 720;
    const h = 360;
    sellers.forEach((n, i) => {
      positions.set(n.id, { x: 80, y: 40 + (i * (h - 80)) / Math.max(sellers.length - 1, 1) });
    });
    categories.forEach((n, i) => {
      positions.set(n.id, {
        x: w - 80,
        y: 40 + (i * (h - 80)) / Math.max(categories.length - 1, 1),
      });
    });
    products.forEach((n, i) => {
      positions.set(n.id, {
        x: w / 2 + ((i % 4) - 1.5) * 40,
        y: 60 + Math.floor(i / 4) * ((h - 80) / Math.max(Math.ceil(products.length / 4), 1)),
      });
    });

    return { positions, edges, nodes: [...sellers, ...categories, ...products] };
  }, [graph]);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white/90 p-4">
      <svg viewBox="0 0 720 360" className="mx-auto h-auto w-full max-w-3xl">
        {layout.edges.map((e, i) => {
          const a = layout.positions.get(e.source);
          const b = layout.positions.get(e.target);
          if (!a || !b) return null;
          return (
            <line
              key={`${e.source}-${e.target}-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#cbd5e1"
              strokeWidth={1}
              strokeDasharray={e.rel === "BELONGS_TO" ? "4 3" : undefined}
            />
          );
        })}
        {layout.nodes.map((n) => {
          const p = layout.positions.get(n.id);
          if (!p) return null;
          const fill = typeColor[n.type] ?? "#475569";
          return (
            <g key={n.id}>
              <circle cx={p.x} cy={p.y} r={n.type === "product" ? 6 : 10} fill={fill} />
              <text
                x={p.x + (n.type === "seller" ? 14 : n.type === "category" ? -14 : 0)}
                y={p.y - 12}
                textAnchor={n.type === "category" ? "end" : "start"}
                className="fill-slate-600 text-[10px]"
              >
                {n.label.length > 18 ? `${n.label.slice(0, 16)}…` : n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-700" /> Seller
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-700" /> Category
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500" /> Product
        </span>
      </div>
    </div>
  );
}
