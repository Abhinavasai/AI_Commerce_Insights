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
  completed: "#0d9488",
  pending: "#f59e0b",
  processing: "#0ea5e9",
  failed: "#f43f5e",
};

const TYPE_COLORS = ["#0d9488", "#0f766e", "#115e59", "#134e4a", "#14b8a6"];

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
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Visualization
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-slate-900">
              Document status mix
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Share of corpus by processing state
              {totalDocs ? ` · ${totalDocs} total` : ""}
            </p>
          </div>
          <Link
            href="/documents"
            className="shrink-0 text-xs font-semibold text-teal-700 hover:underline"
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
                  stroke="none"
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs capitalize text-slate-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">
              {stats ? "No document status data yet" : "Loading chart…"}
            </p>
          )}
        </div>
      </MotionCard>

      <MotionCard className="p-5" delay={0.1} hover3d={false}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Visualization
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-slate-900">
              Insights by type
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Trend · anomaly · recommendation · summary
            </p>
          </div>
          <Link
            href="/insights"
            className="shrink-0 text-xs font-semibold text-teal-700 hover:underline"
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
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: "rgba(13,148,136,0.06)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {insightTypeData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={TYPE_COLORS[i % TYPE_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">
              {stats ? "No insights yet" : "Loading chart…"}
            </p>
          )}
        </div>
      </MotionCard>
    </div>
  );
}
