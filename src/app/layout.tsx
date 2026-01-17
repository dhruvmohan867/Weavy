import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/providers/ClientProviders";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Weavy Clone",
    description: "A clone app inpired from Weavy",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            {/* suppressHydrationWarning prevents console hydration mismatch warnings for attributes added client-side (e.g., extensions) */}
            <body
                suppressHydrationWarning
                data-client-rendered="true"
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <ClientProviders>{children}</ClientProviders>
            </body>
        </html>
    );
}
