import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  completed: "bg-teal-500/15 text-teal-700 ring-teal-500/30",
  pending: "bg-amber-500/15 text-amber-800 ring-amber-500/30",
  processing: "bg-sky-500/15 text-sky-800 ring-sky-500/30",
  failed: "bg-rose-500/15 text-rose-800 ring-rose-500/30",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        styles[key] ?? "bg-slate-500/15 text-slate-700 ring-slate-500/30"
      )}
    >
      {status}
    </span>
  );
}
