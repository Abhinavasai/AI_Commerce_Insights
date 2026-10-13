"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ActivityRiver } from "@/components/dashboard/ActivityRiver";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { PipelineConstellation } from "@/components/dashboard/PipelineConstellation";
import { SignalBrief } from "@/components/dashboard/SignalBrief";
import { PageShell } from "@/components/motion/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { fetchDashboardStats, getApiErrorMessage } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch((e) => setError(getApiErrorMessage(e)));
  }, []);

  return (
    <PageShell>
      <PageHeader
        title="Signal deck"
        description="Not another KPI wall — an interactive pipeline from documents to decisions."
        action={
          stats ? (
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-teal-200">
              Mode · {stats.runtime_mode}
            </span>
          ) : null
        }
      />
      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <PipelineConstellation stats={stats} />

      <div className="mt-6">
        <DashboardCharts stats={stats} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <ActivityRiver stats={stats} />
        <SignalBrief stats={stats} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Categories mapped",
            value: stats?.totals.categories ?? "—",
            href: "/catalog",
          },
          {
            label: "Products extracted",
            value: stats?.totals.products ?? "—",
            href: "/catalog",
          },
          {
            label: "Insights ready",
            value: stats?.totals.insights ?? "—",
            href: "/insights",
          },
        ].map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className="group flex items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-3 transition hover:border-teal-400 hover:bg-teal-50/50"
          >
            <span className="text-xs font-medium text-slate-500">{chip.label}</span>
            <span className="font-display text-xl font-semibold text-slate-900 group-hover:text-teal-800">
              {chip.value}
            </span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
