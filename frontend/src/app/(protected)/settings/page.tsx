"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { fetchMe, getApiErrorMessage, updateMe } from "@/lib/api";
import type { User } from "@/lib/types";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMe()
      .then((u) => {
        setUser(u);
        setFullName(u.full_name);
      })
      .catch((e) => setError(getApiErrorMessage(e)));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const updated = await updateMe({
        full_name: fullName,
        ...(password ? { password } : {}),
      });
      setUser(updated);
      setPassword("");
      setMessage("Profile updated.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Update your profile and credentials."
      />
      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-coral">{message}</p> : null}

      <form
        onSubmit={onSubmit}
        className="max-w-md space-y-4 rounded-xl border-[2.5px] border-ink/15 bg-paper/80 p-6 shadow-sm"
      >
        <div>
          <label className="text-xs font-medium text-ink-muted">Email</label>
          <p className="mt-1 text-sm text-ink">{user?.email ?? "…"}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted">Role</label>
          <p className="mt-1 text-sm capitalize text-ink">{user?.role ?? "…"}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border-[2.5px] border-ink/15 px-3 py-2 text-sm outline-none focus:border-coral"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted">
            New password (leave blank to keep)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="mt-1 w-full rounded-lg border-[2.5px] border-ink/15 px-3 py-2 text-sm outline-none focus:border-coral"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-coral px-5 py-2 text-sm font-semibold text-white hover:bg-coral disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </>
  );
}
