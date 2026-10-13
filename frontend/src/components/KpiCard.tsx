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
        "rounded-xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-sm",
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
              y: -5,
              rotateX: 3,
              rotateY: -3,
              boxShadow: "0 16px 36px -18px rgba(15,23,42,0.35)",
            }
      }
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </motion.div>
  );
}
