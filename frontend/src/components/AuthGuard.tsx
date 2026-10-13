"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchMe } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { User } from "@/lib/types";
import { ProductTour } from "./tour/ProductTour";
import { Sidebar } from "./Sidebar";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [forceTour, setForceTour] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      })
      .finally(() => setReady(true));
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={user?.full_name || user?.email}
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
