"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fetchDocument, getApiErrorMessage } from "@/lib/api";
import type { DocumentDetail } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";

export default function DocumentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchDocument(id)
      .then(setDoc)
      .catch((e) => setError(getApiErrorMessage(e)));
  }, [id]);

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!doc) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title={doc.title} description={doc.file_name} />
      <div className="mb-6 flex flex-wrap gap-3 text-sm text-slate-600">
        <StatusBadge status={doc.status} />
        <span>{formatBytes(doc.file_size)}</span>
        <span>{doc.file_type}</span>
        <span>{doc.chunk_count} chunks</span>
        <span>Updated {formatDate(doc.updated_at)}</span>
      </div>
      {doc.error_message ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {doc.error_message}
        </p>
      ) : null}

      <h2 className="font-display text-lg font-semibold text-slate-900">Chunks</h2>
      <div className="mt-4 space-y-3">
        {doc.chunks.map((c) => (
          <article
            key={c.id}
            className="rounded-xl border border-slate-200/80 bg-white/80 p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>Index {c.chunk_index}</span>
              <span>{c.token_count} tokens</span>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
              {c.content}
            </pre>
          </article>
        ))}
        {!doc.chunks.length ? (
          <p className="text-sm text-slate-500">
            No chunks yet — processing may still be in progress.
          </p>
        ) : null}
      </div>
    </>
  );
}
