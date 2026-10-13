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
      className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border-[2.5px] border-ink/15 bg-paper shadow-comic"
    >
      <div className="border-b-[2.5px] border-ink/10 bg-gradient-to-br from-sun-soft via-paper to-mint-soft px-5 py-5">
        <div className="flex items-center gap-2 text-coral-dark">
          <Sparkles className="h-4 w-4" />
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em]">
            Daily brief
          </p>
        </div>
        <h2 className="mt-2 font-display text-xl font-semibold text-ink">
          What needs attention
        </h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-ink-soft">
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
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-muted">
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
              className="group flex items-start justify-between gap-3 rounded-2xl border-2 border-ink/10 bg-sky-soft/50 px-4 py-3 text-sm font-bold text-ink transition hover:border-coral/40 hover:bg-coral-soft"
            >
              <span>{prompt}</span>
              <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted group-hover:text-coral" />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="border-t-[2.5px] border-ink/10 p-4">
        <Link
          href="/chat"
          className="flex w-full items-center justify-center rounded-xl border-[2.5px] border-ink bg-coral py-2.5 text-sm font-extrabold text-white shadow-comic transition hover:-translate-y-0.5 hover:bg-coral-dark hover:shadow-comic-hover"
        >
          Open Ask agent
        </Link>
      </div>
    </div>
  );
}
