"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "rounded-comic border-[2.5px] border-ink/15 bg-paper p-5 shadow-comic",
        "transform-gpu",
        className
      )}
      style={{ transformStyle: "preserve-3d" }}
      initial={reduce ? false : { opacity: 0, y: 14, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      whileHover={
        reduce
          ? undefined
          : {
              y: -4,
              rotateX: 2,
              rotateY: -2,
              boxShadow: "6px 6px 0 0 rgba(27,43,75,0.2)",
            }
      }
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <p className="text-sm font-bold text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs font-semibold text-ink-muted/80">{hint}</p> : null}
    </motion.div>
  );
}
