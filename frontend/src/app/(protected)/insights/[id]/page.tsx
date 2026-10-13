"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MarkdownView } from "@/components/MarkdownView";
import { PageHeader } from "@/components/PageHeader";
import { fetchInsight, getApiErrorMessage } from "@/lib/api";
import type { Insight } from "@/lib/types";
import { formatDate, formatPercent } from "@/lib/utils";

export default function InsightDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [insight, setInsight] = useState<Insight | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInsight(id)
      .then(setInsight)
      .catch((e) => setError(getApiErrorMessage(e)));
  }, [id]);

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!insight) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={insight.title}
        description={`${insight.insight_type} · ${formatPercent(insight.confidence)} confidence · ${formatDate(insight.created_at)}`}
      />
      <article className="rounded-xl border border-slate-200/80 bg-white/80 p-6 shadow-sm">
        <MarkdownView content={insight.content} />
      </article>
      {insight.tags.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {insight.tags.map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              #{t}
            </span>
          ))}
        </div>
      ) : null}
      {insight.source_document_ids.length ? (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-800">Source documents</h2>
          <ul className="mt-2 space-y-1">
            {insight.source_document_ids.map((docId) => (
              <li key={docId}>
                <Link href={`/documents/${docId}`} className="text-sm text-teal-700 hover:underline">
                  {docId}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
