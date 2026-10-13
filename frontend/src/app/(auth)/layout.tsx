"use client";

import { FloatingBackdrop } from "@/components/motion/FloatingBackdrop";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-auth-pattern relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <FloatingBackdrop />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
