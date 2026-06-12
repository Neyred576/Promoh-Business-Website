import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import GlobalAnnouncement from "@/components/layout/GlobalAnnouncement";
import AIAssistant from "@/components/ui/AIAssistant";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Promoh | Find Trusted Professionals Anywhere",
  description: "The most trusted global marketplace for finding and booking verified service professionals.",
  openGraph: {
    title: "Promoh | Trusted Professionals",
    description: "Book verified service professionals instantly.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Promoh",
    description: "Book verified service professionals instantly.",
  }
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
          <AIAssistant />
        </AuthProvider>
      </body>
    </html>
  );
}
