"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-a:text-teal-700">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
