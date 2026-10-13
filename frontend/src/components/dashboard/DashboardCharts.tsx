"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MotionCard } from "@/components/motion/MotionCard";
import type { DashboardStats } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  completed: "#06d6a0",
  pending: "#ffd166",
  processing: "#4cc9f0",
  failed: "#ff5a5f",
};

const TYPE_COLORS = ["#ff5a5f", "#ffd166", "#06d6a0", "#4cc9f0", "#1b2b4b"];

export function DashboardCharts({ stats }: { stats: DashboardStats | null }) {
  const statusData = stats
    ? Object.entries(stats.document_status).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const insightTypeData = stats
    ? Object.entries(stats.insights_by_type).map(([name, value]) => ({
        name,
        count: value,
      }))
    : [];

  const totalDocs = statusData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <MotionCard className="p-5" delay={0.05} hover3d={false}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
              Visualization
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-ink">
              Document status mix
            </h2>
            <p className="mt-1 text-xs font-semibold text-ink-soft">
              Share of corpus by processing state
              {totalDocs ? ` · ${totalDocs} total` : ""}
            </p>
          </div>
          <Link
            href="/documents"
            className="shrink-0 text-xs font-extrabold text-coral hover:underline"
          >
            Open documents
          </Link>
        </div>
        <div className="mt-4 h-64">
          {statusData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={86}
                  paddingAngle={3}
                  stroke="#1b2b4b"
                  strokeWidth={2}
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] ?? "#6b7c99"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "2.5px solid rgba(27,43,75,0.15)",
                    fontSize: 12,
                    background: "#fffdf8",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs font-bold capitalize text-ink-soft">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm font-semibold text-ink-muted">
              {stats ? "No document status data yet" : "Loading chart…"}
            </p>
          )}
        </div>
      </MotionCard>

      <MotionCard className="p-5" delay={0.1} hover3d={false}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
              Visualization
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-ink">
              Insights by type
            </h2>
            <p className="mt-1 text-xs font-semibold text-ink-soft">
              Trend · anomaly · recommendation · summary
            </p>
          </div>
          <Link
            href="/insights"
            className="shrink-0 text-xs font-extrabold text-coral hover:underline"
          >
            Open insights
          </Link>
        </div>
        <div className="mt-4 h-64">
          {insightTypeData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insightTypeData} barCategoryGap="28%">
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#3a4d73", fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#3a4d73", fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,90,95,0.08)" }}
                  contentStyle={{
                    borderRadius: 16,
                    border: "2.5px solid rgba(27,43,75,0.15)",
                    fontSize: 12,
                    background: "#fffdf8",
                  }}
                />
                <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                  {insightTypeData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={TYPE_COLORS[i % TYPE_COLORS.length]}
                      stroke="#1b2b4b"
                      strokeWidth={1.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm font-semibold text-ink-muted">
              {stats ? "No insights yet" : "Loading chart…"}
            </p>
          )}
        </div>
      </MotionCard>
    </div>
  );
}
