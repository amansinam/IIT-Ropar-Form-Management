"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    // Verifiers and admins logged in via Google must use their own portal
    // They can still VIEW but cannot submit forms — show a warning instead of blocking
    // (The submitForm API already blocks them via userExists check)
  }, [isAuthenticated, status, router]);

  if (status === "loading" || !isAuthenticated) {
    return null;
  }

  const isVerifierOrAdmin = session?.user?.portal === "verifier" || session?.user?.portal === "admin";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {isVerifierOrAdmin && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-700">
          ⚠️ You are logged in as a <strong>{session?.user?.role}</strong>. This is the student portal.
          Form submissions are disabled for verifier/admin accounts.
          Please use your dedicated portal.
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

