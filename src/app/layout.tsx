import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
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

// Removed invalid GeistSans import and usage

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
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<ClientProviders>{children}</ClientProviders>
			</body>
		</html>
	);
}
