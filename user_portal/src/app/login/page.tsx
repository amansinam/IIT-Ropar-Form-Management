"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Loader2, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    // Check session status directly, not AuthContext (which may not be ready yet)
    if (status === "authenticated" && session?.user) {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    // Use absolute URL to redirect to user portal (not backend)
    // Backend's redirect callback now allows cross-origin redirects
    await signIn("google", { callbackUrl: "http://localhost:3000/dashboard" });
    setGoogleLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left: Gradient Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white animate-pulse" />
          <div
            className="absolute bottom-32 right-20 w-48 h-48 rounded-full bg-white animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="mx-auto mb-6 h-28 w-28 flex items-center justify-center rounded-2xl bg-white/20">
            <span className="text-white font-heading font-bold text-4xl">IIT</span>
          </div>
          <h2 className="font-heading text-3xl font-bold text-white mb-3">
            Centralized Forms Portal
          </h2>
          <p className="text-white/70 text-sm max-w-sm mx-auto leading-relaxed">
            Submit, track, and manage all institutional forms digitally. A modern
            solution for IIT Ropar.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-white/50 text-xs">
            <Shield className="h-4 w-4" />
            <span>Secure &amp; Encrypted</span>
          </div>
        </div>
      </div>

      {/* ── Right: Login Form ── */}
      <div className="flex flex-1 items-center justify-center px-6 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 h-20 w-20 flex items-center justify-center rounded-2xl gradient-primary">
              <span className="text-white font-heading font-bold text-2xl">IIT</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-gradient">
              Centralized Forms Portal
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Indian Institute of Technology Ropar
            </p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to access your forms portal
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 sm:p-8">
            {/* Institution badge */}
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <span className="text-white font-heading font-bold text-xs">IIT</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">IIT Ropar</p>
                <p className="text-xs text-muted-foreground">
                  Sign in with your institutional Google account
                </p>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              type="button"
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
            </Button>

            <Separator className="my-6" />

            {/* Info note */}
            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              Use your{" "}
              <span className="font-medium text-foreground">@iitrpr.ac.in</span>{" "}
              Google account to sign in. Access is restricted to verified
              institutional accounts only.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Indian Institute of Technology Ropar
          </p>
        </motion.div>
      </div>
    </div>
  );
}