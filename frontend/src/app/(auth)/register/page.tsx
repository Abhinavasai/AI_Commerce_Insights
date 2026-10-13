"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getApiErrorMessage, register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, fullName);
      router.replace("/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/90 p-8 shadow-2xl backdrop-blur">
      <h1 className="font-display text-2xl font-semibold text-white">Create account</h1>
      <p className="mt-1 text-sm text-slate-400">Join as an analyst on the platform</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none ring-teal-500/50 focus:ring-2"
          />
        </div>
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
          <label className="block text-xs font-medium text-slate-300">
            Password (min 6 characters)
          </label>
          <input
            type="password"
            required
            minLength={6}
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
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Register"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-teal-400 hover:text-teal-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
