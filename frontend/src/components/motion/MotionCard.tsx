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
        "rounded-comic border-[2.5px] border-ink/15 bg-paper shadow-comic",
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
              boxShadow: "6px 6px 0 0 rgba(27, 43, 75, 0.2)",
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
