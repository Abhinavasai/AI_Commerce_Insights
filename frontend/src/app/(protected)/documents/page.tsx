"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fetchDocuments, getApiErrorMessage, uploadDocument } from "@/lib/api";
import type { Document } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  function load() {
    fetchDocuments()
      .then(setDocs)
      .catch((e) => setError(getApiErrorMessage(e)));
  }

  useEffect(() => {
    load();
  }, []);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await uploadDocument(file, title || file.name);
      setFile(null);
      setTitle("");
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Documents"
        description="Upload source files for ingestion, chunking, and insight generation."
      />
      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <form
        data-tour="upload-zone"
        onSubmit={onUpload}
        className="mb-8 rounded-xl border border-slate-200/80 bg-white/80 p-5 shadow-sm transition hover:shadow-md"
      >
        <h2 className="text-sm font-semibold text-slate-800">Upload document</h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-500">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional display title"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-500">File</label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-teal-500"
            />
          </div>
          <button
            type="submit"
            disabled={uploading || !file}
            className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/80 shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Chunks</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {docs.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/documents/${d.id}`}
                    className="font-medium text-teal-700 hover:underline"
                  >
                    {d.title}
                  </Link>
                  <p className="text-xs text-slate-400">{d.file_name}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">{formatBytes(d.file_size)}</td>
                <td className="px-4 py-3 text-slate-600">{d.chunk_count}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(d.updated_at)}</td>
              </tr>
            ))}
            {!docs.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No documents yet — upload one to start the pipeline.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
