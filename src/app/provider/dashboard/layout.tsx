"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LayoutDashboard, User, CheckCircle, LogOut } from "lucide-react";
import Image from "next/image";

export default function ProviderDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/provider/login");
      } else if (user.role !== "provider" && user.role !== "admin") {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-secondary-200 text-secondary-900 flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-secondary-200">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Promoh Logo" width={32} height={32} className="object-contain" />
            <span className="text-xl font-bold tracking-tight text-primary-600">Provider</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/provider/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-50 text-secondary-600 hover:text-primary-600 transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link href="/provider/dashboard/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-50 text-secondary-600 hover:text-primary-600 transition-colors">
            <User className="w-5 h-5" />
            Business Profile
          </Link>
          <Link href="/provider/dashboard/verification" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-50 text-secondary-600 hover:text-primary-600 transition-colors">
            <CheckCircle className="w-5 h-5" />
            Verification Center
          </Link>
        </nav>
        <div className="p-4 border-t border-secondary-200">
          <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-50 text-secondary-600 hover:text-red-600 transition-colors text-left">
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
