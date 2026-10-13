"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearTokens } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav = [
  {
    href: "/dashboard",
    label: "Signal deck",
    hint: "Live ops pulse",
    icon: LayoutDashboard,
  },
  {
    href: "/documents",
    label: "Documents",
    hint: "Ingest & status",
    icon: FileText,
  },
  {
    href: "/chat",
    label: "Ask agent",
    hint: "Grounded Q&A",
    icon: MessageSquare,
  },
  {
    href: "/insights",
    label: "Insights",
    hint: "AI findings",
    icon: Sparkles,
  },
  {
    href: "/catalog",
    label: "Catalog graph",
    hint: "Sellers & SKUs",
    icon: Store,
  },
  {
    href: "/settings",
    label: "Settings",
    hint: "Profile",
    icon: Settings,
  },
];

const iconColors = [
  "bg-coral text-white",
  "bg-sky-cartoon text-ink",
  "bg-mint text-ink",
  "bg-sun text-ink",
  "bg-coral-soft text-coral-dark",
  "bg-mint-soft text-mint-dark",
];

export function Sidebar({
  userName,
  onStartTour,
}: {
  userName?: string;
  onStartTour?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearTokens();
    router.replace("/dashboard");
  }

  return (
    <aside
      data-tour="sidebar"
      className="relative flex h-full w-[17.5rem] shrink-0 flex-col overflow-hidden border-r-[3px] border-ink/15 bg-paper text-ink"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-coral via-sun to-mint"
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -left-8 top-20 h-44 w-44 rounded-full bg-sun/40 blur-3xl"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-10 bottom-28 h-40 w-40 rounded-full bg-mint/30 blur-3xl"
        animate={{ opacity: [0.3, 0.55, 0.3], y: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative px-5 pb-4 pt-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-ink bg-coral font-display text-sm font-bold tracking-tight text-white shadow-comic">
            CI
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="font-display text-[1.15rem] font-semibold leading-tight text-ink">
              Commerce Insights
            </p>
            <p className="mt-0.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-coral">
              Signal workspace
            </p>
          </div>
        </div>
      </div>

      <div className="relative px-4 pb-2">
        <p className="px-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-muted">
          Navigate
        </p>
      </div>

      <nav className="relative flex-1 space-y-1.5 px-3 pb-3">
        {nav.map((item, i) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.03 * i }}
            >
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl border-[2.5px] px-3 py-2.5 transition-all",
                  active
                    ? "border-ink bg-sun/70 text-ink shadow-comic"
                    : "border-transparent text-ink-soft hover:border-ink/15 hover:bg-white/80"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink/10 transition",
                    active ? "border-ink/20 bg-white" : iconColors[i % iconColors.length]
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold leading-tight">
                    {item.label}
                  </span>
                  <span className="block truncate text-[11px] font-semibold text-ink-muted">
                    {item.hint}
                  </span>
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="relative space-y-2 border-t-[3px] border-ink/10 bg-sun-soft/50 p-4">
        {userName ? (
          <div className="mb-1 flex items-center gap-2 rounded-xl border-2 border-ink/15 bg-paper px-3 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink/10 bg-mint text-[10px] font-extrabold text-ink">
              {userName.slice(0, 1).toUpperCase()}
            </span>
            <p className="truncate text-xs font-bold text-ink">{userName}</p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onStartTour}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-[2.5px] border-ink bg-coral px-3 py-2.5 text-sm font-extrabold text-white shadow-comic transition hover:-translate-y-0.5 hover:bg-coral-dark hover:shadow-comic-hover"
        >
          <BookOpen className="h-4 w-4" />
          Product tour
        </button>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink-muted transition hover:bg-paper hover:text-ink"
        >
          <LogOut className="h-4 w-4" />
          Refresh demo
        </button>
      </div>
    </aside>
  );
}
