import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  completed: "bg-mint-soft text-mint-dark border-mint/40",
  pending: "bg-sun-soft text-ink border-sun/60",
  processing: "bg-sky-soft text-ink border-sky-cartoon/50",
  failed: "bg-coral-soft text-coral-dark border-coral/40",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xl border-2 px-2.5 py-0.5 text-xs font-extrabold capitalize",
        styles[key] ?? "bg-paper-warm text-ink-soft border-ink/15"
      )}
    >
      {status}
    </span>
  );
}
