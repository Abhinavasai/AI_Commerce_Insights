"use client";

import { useEffect, useState } from "react";
import { fetchMe } from "@/lib/api";
import type { User } from "@/lib/types";
import { ProductTour } from "./tour/ProductTour";
import { Sidebar } from "./Sidebar";

/** Vercel demo: no login — open the app with seeded SQLite data. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [forceTour, setForceTour] = useState(false);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() =>
        setUser({
          id: "demo",
          email: "analyst@demo.com",
          full_name: "Demo Analyst",
          role: "analyst",
          is_active: true,
        })
      )
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-gradient">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-ink/15 border-t-coral" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={user?.full_name || user?.email || "Demo Analyst"}
        onStartTour={() => setForceTour(true)}
      />
      <main className="relative min-w-0 flex-1 overflow-auto bg-app-gradient p-5 md:p-8">
        <div className="relative mx-auto max-w-6xl">{children}</div>
      </main>
      <ProductTour
        forceOpen={forceTour}
        onCloseForce={() => setForceTour(false)}
      />
    </div>
  );
}
