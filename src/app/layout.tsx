import type { Metadata } from "next";
import { Inter, VT323 } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { CSPostHogProvider } from "../providers/PostHogProvider";
import { WorkspaceProvider } from "../providers/WorkspaceProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-vt323",
});

const basementGrotesque = localFont({
  src: "../../public/fonts/basement_grotesque/BasementGrotesque-Black_v1.202.otf",
  variable: "--font-basement",
  display: "swap",
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
      <html lang="en" className={`${inter.variable} ${vt323.variable} ${basementGrotesque.variable} font-sans h-full antialiased`}>
        <CSPostHogProvider>
          <WorkspaceProvider>
            <body className="min-h-full flex flex-col">{children}</body>
          </WorkspaceProvider>
        </CSPostHogProvider>
      </html>
    </ClerkProvider>
  );
}
