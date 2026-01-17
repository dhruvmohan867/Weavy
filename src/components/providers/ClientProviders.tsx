"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/components/providers/AuthProvider";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <AuthProvider>{children}</AuthProvider>
        </ClerkProvider>
    );
}