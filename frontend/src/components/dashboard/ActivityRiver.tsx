"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { DashboardStats } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPercent } from "@/lib/utils";

type Event = {
  id: string;
  kind: "document" | "insight";
  title: string;
  meta: string;
  href: string;
  status?: string;
};

export function ActivityRiver({ stats }: { stats: DashboardStats | null }) {
  const events: Event[] = [
    ...(stats?.recent_documents ?? []).map((d) => ({
      id: `d-${d.id}`,
      kind: "document" as const,
      title: d.title,
      meta: "Document",
      href: `/documents/${d.id}`,
      status: d.status,
    })),
    ...(stats?.recent_insights ?? []).map((i) => ({
      id: `i-${i.id}`,
      kind: "insight" as const,
      title: i.title,
      meta: `${i.insight_type} · ${formatPercent(i.confidence)}`,
      href: `/insights/${i.id}`,
    })),
  ].slice(0, 8);

  return (
    <div
      data-tour="activity"
      className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Signal river
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-slate-900">
            Recent movement
          </h2>
        </div>
        <Link
          href="/documents"
          className="text-xs font-semibold text-teal-700 hover:underline"
        >
          All documents
        </Link>
      </div>

      <ol className="relative mt-6 space-y-0">
        <div
          className="absolute bottom-2 left-[15px] top-2 w-px bg-gradient-to-b from-teal-400 via-slate-200 to-transparent"
          aria-hidden
        />
        {events.map((ev, i) => (
          <motion.li
            key={ev.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * i }}
            className="relative grid grid-cols-[32px_1fr] gap-3 py-3"
          >
            <span
              className={`relative z-[1] mt-1 flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ring-4 ring-white ${
                ev.kind === "document"
                  ? "bg-teal-600 text-white"
                  : "bg-amber-500 text-white"
              }`}
            >
              {ev.kind === "document" ? "D" : "I"}
            </span>
            <Link
              href={ev.href}
              className="group rounded-2xl px-3 py-2 transition hover:bg-slate-50"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900 group-hover:text-teal-800">
                  {ev.title}
                </p>
                {ev.status ? <StatusBadge status={ev.status} /> : null}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{ev.meta}</p>
            </Link>
          </motion.li>
        ))}
        {!events.length ? (
          <li className="py-6 pl-12 text-sm text-slate-500">
            No activity yet — upload a document to start the river.
          </li>
        ) : null}
      </ol>
    </div>
  );
}
