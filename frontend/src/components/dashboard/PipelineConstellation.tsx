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
      accent: "from-coral to-coral-dark",
    },
    {
      id: "catalog",
      label: "Graph",
      sub: `${stats?.totals.products ?? 0} products`,
      href: "/catalog",
      value: stats?.totals.sellers ?? "—",
      icon: Store,
      accent: "from-sky-cartoon to-sky-cartoon",
    },
    {
      id: "insights",
      label: "Signals",
      sub: "AI findings",
      href: "/insights",
      value: stats?.totals.insights ?? "—",
      icon: Sparkles,
      accent: "from-sun to-[#f0b429]",
    },
    {
      id: "chat",
      label: "Ask",
      sub: "Agent sessions",
      href: "/chat",
      value: stats?.totals.chat_sessions ?? "—",
      icon: MessageSquare,
      accent: "from-mint to-mint-dark",
    },
  ];

  return (
    <div
      data-tour="kpi-cards"
      className="relative overflow-hidden rounded-[1.75rem] border-[3px] border-ink bg-ink text-white shadow-comic-lg"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 28%, rgba(255,90,95,0.45), transparent 38%), radial-gradient(circle at 82% 68%, rgba(255,209,102,0.35), transparent 36%), radial-gradient(circle at 55% 20%, rgba(6,214,160,0.25), transparent 40%), linear-gradient(135deg,#1b2b4b,#243656 55%,#1b2b4b)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.55) 1.5px, transparent 1.6px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sun">
              Intelligence pipeline
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
              From files to decisions
            </h2>
            <p className="mt-2 max-w-xl text-sm font-semibold text-white/75">
              Click any station to open that workspace. Flow reads left → right:
              ingest, extract entities, generate signals, then ask the agent.
            </p>
          </div>
          <div className="rounded-2xl border-2 border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/60">
              Pipeline health
            </p>
            <p className="mt-1 font-display text-lg text-white">
              <span className="text-mint">{completed}</span>
              <span className="text-white/50"> ready</span>
              {inFlight ? (
                <span className="ml-2 text-sm font-bold text-sun">
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
                    className="relative h-full overflow-hidden rounded-2xl border-2 border-white/15 bg-white/10 p-4 transition group-hover:border-sun/60 group-hover:bg-white/15"
                    whileHover={reduce ? undefined : { y: -4, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  >
                    <div
                      className={cn(
                        "mb-4 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink/20 bg-gradient-to-br text-ink shadow-comic",
                        node.accent
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/55">
                      {node.label}
                    </p>
                    <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
                      {node.value}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-white/55">{node.sub}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-sun opacity-90 group-hover:opacity-100">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </motion.div>
                </Link>
                {i < nodes.length - 1 ? (
                  <div className="hidden items-center px-1 lg:flex" aria-hidden>
                    <motion.div
                      className="h-1 w-6 rounded-full bg-gradient-to-r from-sun to-transparent"
                      animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    />
                    <ArrowRight className="h-4 w-4 text-sun/80" />
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
