"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Soft floating blobs for auth / hero surfaces */
export function FloatingBackdrop() {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -left-16 top-20 h-64 w-64 rounded-full bg-coral/30 blur-3xl"
        animate={{ y: [0, -24, 0], x: [0, 12, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-sun/25 blur-3xl"
        animate={{ y: [0, 20, 0], x: [0, -16, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-mint/20 blur-2xl"
        animate={{ rotate: [0, 25, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      />
    </div>
  );
}
