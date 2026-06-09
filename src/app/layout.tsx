import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import GlobalAnnouncement from "@/components/layout/GlobalAnnouncement";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Promoh | Find Trusted Professionals Anywhere",
  description: "The most trusted global marketplace for finding and booking verified service professionals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-foreground bg-background">
        <GlobalAnnouncement />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
