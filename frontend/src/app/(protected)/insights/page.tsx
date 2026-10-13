"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { fetchInsights, getApiErrorMessage } from "@/lib/api";
import type { Insight } from "@/lib/types";
import { formatDate, formatPercent } from "@/lib/utils";

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInsights({
      insight_type: typeFilter || undefined,
      tag: tagFilter || undefined,
    })
      .then(setInsights)
      .catch((e) => setError(getApiErrorMessage(e)));
  }, [typeFilter, tagFilter]);

  const types = useMemo(
    () => Array.from(new Set(insights.map((i) => i.insight_type))).sort(),
    [insights]
  );

  return (
    <>
      <PageHeader
        title="Insights"
        description="Generated intelligence from your document corpus and catalog."
      />
      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border-[2.5px] border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-coral"
        >
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          placeholder="Filter by tag"
          className="rounded-lg border-[2.5px] border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-coral"
        />
      </div>

      <div data-tour="insights-grid" className="grid gap-4 sm:grid-cols-2">
        {insights.map((ins) => (
          <Link
            key={ins.id}
            href={`/insights/${ins.id}`}
            className="group rounded-xl border-[2.5px] border-ink/15 bg-paper/80 p-5 shadow-sm transition hover:border-coral/50 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-ink group-hover:text-coral-dark">
                {ins.title}
              </h2>
              <span className="shrink-0 rounded-full bg-coral/10 px-2 py-0.5 text-xs font-medium text-coral-dark">
                {formatPercent(ins.confidence)}
              </span>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{ins.content}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <span className="rounded bg-sky-soft/60 px-2 py-0.5">{ins.insight_type}</span>
              {ins.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded bg-sky-soft/60 px-2 py-0.5">
                  #{tag}
                </span>
              ))}
              <span className="ml-auto">{formatDate(ins.created_at)}</span>
            </div>
          </Link>
        ))}
        {!insights.length ? (
          <p className="col-span-full text-sm text-ink-muted">No insights match your filters.</p>
        ) : null}
      </div>
    </>
  );
}
