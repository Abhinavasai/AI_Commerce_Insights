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
      className="relative flex h-full w-[17.5rem] shrink-0 flex-col overflow-hidden border-r border-slate-200/90 bg-[#f7faf9] text-slate-800"
    >
      {/* Brand column accent */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-teal-500 via-teal-600/80 to-slate-300"
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -left-8 top-24 h-48 w-48 rounded-full bg-teal-400/15 blur-3xl"
        animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative px-5 pb-4 pt-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold tracking-tight text-teal-300 shadow-lg shadow-slate-900/20">
            CI
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="font-display text-[1.05rem] font-semibold leading-tight text-slate-900">
              Commerce Insights
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-teal-700/80">
              Signal workspace
            </p>
          </div>
        </div>
      </div>

      <div className="relative px-4 pb-2">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Navigate
        </p>
      </div>

      <nav className="relative flex-1 space-y-1 px-3 pb-3">
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
                  "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all",
                  active
                    ? "bg-white text-slate-900 shadow-md shadow-slate-900/5 ring-1 ring-slate-200/80"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-y-2 left-0 w-1 rounded-full bg-teal-500"
                  />
                ) : null}
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition",
                    active
                      ? "bg-teal-600 text-white shadow-sm shadow-teal-700/30"
                      : "bg-slate-200/70 text-slate-600 group-hover:bg-teal-100 group-hover:text-teal-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">
                    {item.label}
                  </span>
                  <span className="block truncate text-[11px] text-slate-400">
                    {item.hint}
                  </span>
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="relative space-y-2 border-t border-slate-200/80 bg-white/40 p-4 backdrop-blur-sm">
        {userName ? (
          <div className="mb-1 flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200/80">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600/15 text-[10px] font-bold text-teal-800">
              {userName.slice(0, 1).toUpperCase()}
            </span>
            <p className="truncate text-xs font-medium text-slate-700">{userName}</p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onStartTour}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <BookOpen className="h-4 w-4 text-teal-300" />
          Product tour
        </button>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-200/60 hover:text-slate-800"
        >
          <LogOut className="h-4 w-4" />
          Refresh demo
        </button>
      </div>
    </aside>
  );
}
