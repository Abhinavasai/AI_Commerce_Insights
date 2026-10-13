"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function MotionCard({
  children,
  className,
  delay = 0,
  hover3d = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover3d?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-sm",
        "transform-gpu will-change-transform",
        className
      )}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      initial={reduce ? false : { opacity: 0, y: 16, rotateX: 6 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        reduce || !hover3d
          ? undefined
          : {
              y: -4,
              rotateX: 2,
              rotateY: -2,
              scale: 1.01,
              boxShadow:
                "0 18px 40px -20px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(13, 148, 136, 0.12)",
            }
      }
    >
      {children}
    </motion.div>
  );
}

export function StaggerChildren({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: reduce ? 0 : 0.06 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function FadeItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
