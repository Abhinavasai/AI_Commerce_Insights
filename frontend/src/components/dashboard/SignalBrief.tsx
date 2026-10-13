"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { DashboardStats } from "@/lib/types";

const PROMPTS = [
  "Which sellers lead Electronics?",
  "Summarize compliance risks this quarter",
  "Any pricing anomalies in Outdoor?",
];

export function SignalBrief({ stats }: { stats: DashboardStats | null }) {
  const topInsight = stats?.recent_insights?.[0];
  const failed = stats?.document_status?.failed ?? 0;
  const pending =
    (stats?.document_status?.pending ?? 0) +
    (stats?.document_status?.processing ?? 0);

  return (
    <div
      data-tour="analytics"
      className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 bg-gradient-to-br from-teal-50/80 to-white px-5 py-5">
        <div className="flex items-center gap-2 text-teal-800">
          <Sparkles className="h-4 w-4" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
            Daily brief
          </p>
        </div>
        <h2 className="mt-2 font-display text-xl font-semibold text-slate-900">
          What needs attention
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {topInsight
            ? `Latest signal: “${topInsight.title}” (${topInsight.insight_type}). `
            : "No insights yet — generate from a completed document. "}
          {pending
            ? `${pending} document(s) still processing. `
            : "Ingest queue is clear. "}
          {failed ? `${failed} failed — open Documents to retry.` : ""}
        </p>
      </div>

      <div className="flex-1 space-y-3 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Jump into the agent
        </p>
        {PROMPTS.map((prompt, i) => (
          <motion.div
            key={prompt}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Link
              href={`/chat?q=${encodeURIComponent(prompt)}`}
              className="group flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200/80 transition hover:bg-teal-50 hover:text-teal-900 hover:ring-teal-200"
            >
              <span>{prompt}</span>
              <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-teal-600" />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="border-t border-slate-100 p-4">
        <Link
          href="/chat"
          className="flex w-full items-center justify-center rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500"
        >
          Open Ask agent
        </Link>
      </div>
    </div>
  );
}
