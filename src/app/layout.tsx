import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { CSPostHogProvider } from "../providers/PostHogProvider";
import { WorkspaceProvider } from "../providers/WorkspaceProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Prism — Consumer Intelligence Platform",
  description: "Transform millions of customer voices into executive-grade strategic intelligence. Sentiment, contradiction maps, churn signals, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} font-sans h-full antialiased`}>
        <CSPostHogProvider>
          <WorkspaceProvider>
            <body className="min-h-full flex flex-col">{children}</body>
          </WorkspaceProvider>
        </CSPostHogProvider>
      </html>
    </ClerkProvider>
  );
}
