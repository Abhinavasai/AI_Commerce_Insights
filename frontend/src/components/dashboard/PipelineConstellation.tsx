"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  MessageSquare,
  Sparkles,
  Store,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

type NodeDef = {
  id: string;
  label: string;
  sub: string;
  href: string;
  value: number | string;
  icon: LucideIcon;
  accent: string;
};

export function PipelineConstellation({ stats }: { stats: DashboardStats | null }) {
  const reduce = useReducedMotion();
  const status = stats?.document_status;
  const completed = status?.completed ?? 0;
  const inFlight =
    (status?.pending ?? 0) + (status?.processing ?? 0) + (status?.failed ?? 0);

  const nodes: NodeDef[] = [
    {
      id: "docs",
      label: "Corpus",
      sub: "Source files",
      href: "/documents",
      value: stats?.totals.documents ?? "—",
      icon: FileText,
      accent: "from-teal-500 to-teal-700",
    },
    {
      id: "catalog",
      label: "Graph",
      sub: `${stats?.totals.products ?? 0} products`,
      href: "/catalog",
      value: stats?.totals.sellers ?? "—",
      icon: Store,
      accent: "from-slate-700 to-slate-900",
    },
    {
      id: "insights",
      label: "Signals",
      sub: "AI findings",
      href: "/insights",
      value: stats?.totals.insights ?? "—",
      icon: Sparkles,
      accent: "from-amber-500 to-orange-600",
    },
    {
      id: "chat",
      label: "Ask",
      sub: "Agent sessions",
      href: "/chat",
      value: stats?.totals.chat_sessions ?? "—",
      icon: MessageSquare,
      accent: "from-sky-500 to-cyan-700",
    },
  ];

  return (
    <div
      data-tour="kpi-cards"
      className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-950 text-white shadow-xl shadow-slate-900/20"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(45,212,191,0.35), transparent 40%), radial-gradient(circle at 80% 70%, rgba(56,189,248,0.2), transparent 35%), linear-gradient(135deg,#0b1220,#111827 55%,#0f172a)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-300/90">
              Intelligence pipeline
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
              From files to decisions
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Click any station to open that workspace. Flow reads left → right:
              ingest, extract entities, generate signals, then ask the agent.
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10 backdrop-blur">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Pipeline health
            </p>
            <p className="mt-1 font-display text-lg text-white">
              <span className="text-teal-300">{completed}</span>
              <span className="text-slate-500"> ready</span>
              {inFlight ? (
                <span className="ml-2 text-sm text-amber-300">
                  · {inFlight} in flight / failed
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
          {nodes.map((node, i) => {
            const Icon = node.icon;
            return (
              <div key={node.id} className="flex flex-1 items-stretch lg:items-center">
                <Link href={node.href} className="group relative block w-full">
                  <motion.div
                    className="relative h-full overflow-hidden rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10 transition group-hover:bg-white/[0.08] group-hover:ring-teal-400/40"
                    whileHover={reduce ? undefined : { y: -4, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  >
                    <div
                      className={cn(
                        "mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                        node.accent
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {node.label}
                    </p>
                    <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
                      {node.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{node.sub}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-300 opacity-80 group-hover:opacity-100">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </motion.div>
                </Link>
                {i < nodes.length - 1 ? (
                  <div className="hidden items-center px-1 lg:flex" aria-hidden>
                    <motion.div
                      className="h-px w-6 bg-gradient-to-r from-teal-400/80 to-transparent"
                      animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    />
                    <ArrowRight className="h-4 w-4 text-teal-400/70" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
