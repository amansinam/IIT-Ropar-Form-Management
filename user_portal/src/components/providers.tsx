"use client";   // ← this is the client boundary

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuthProvider>
                {children}
                <Toaster richColors />
            </AuthProvider>
        </SessionProvider>
    );
}