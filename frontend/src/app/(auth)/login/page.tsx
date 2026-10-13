"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { getApiErrorMessage, login } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("analyst@demo.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const reduce = useReducedMotion();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace(next);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="rounded-2xl border border-slate-700/50 bg-slate-900/90 p-8 shadow-2xl backdrop-blur"
      style={{ transformStyle: "preserve-3d", perspective: 1200 }}
      initial={reduce ? false : { opacity: 0, y: 24, rotateX: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      whileHover={
        reduce
          ? undefined
          : { rotateY: -2, rotateX: 2, boxShadow: "0 30px 60px -20px rgba(0,0,0,0.55)" }
      }
    >
      <h1 className="font-display text-2xl font-semibold text-white">Sign in</h1>
      <p className="mt-1 text-sm text-slate-400">
        Access your commerce intelligence workspace
      </p>
      <p className="mt-4 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs text-teal-200">
        Demo: <span className="font-mono">analyst@demo.com</span> /{" "}
        <span className="font-mono">demo1234</span>
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none ring-teal-500/50 focus:ring-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none ring-teal-500/50 focus:ring-2"
          />
        </div>
        {error ? (
          <p className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        ) : null}
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60"
          whileTap={reduce ? undefined : { scale: 0.98 }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </motion.button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        No account?{" "}
        <Link href="/register" className="font-medium text-teal-400 hover:text-teal-300">
          Register
        </Link>
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
