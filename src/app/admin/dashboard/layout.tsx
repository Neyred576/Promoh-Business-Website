"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, UserCheck, Settings, LogOut, Globe } from "lucide-react";
import Image from "next/image";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const session = getCookie("admin_session");
    if (session === "authenticated") {
      setAuthorized(true);
    } else {
      router.replace("/admin/login");
    }
  }, [router]);

  const handleLogout = () => {
    document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/admin/login");
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { href: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Control Center" },
    { href: "/admin/dashboard#customers", icon: <Users className="w-5 h-5" />, label: "Customers" },
    { href: "/admin/dashboard#providers", icon: <UserCheck className="w-5 h-5" />, label: "Providers & Approvals" },
    { href: "/admin/dashboard#categories", icon: <Settings className="w-5 h-5" />, label: "Categories" },
    { href: "/admin/dashboard#homepage-cms", icon: <Globe className="w-5 h-5" />, label: "Homepage CMS" },
  ];

  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-indigo-950 text-white flex flex-col shadow-xl z-10 md:min-h-screen">
        <div className="h-20 flex items-center px-6 border-b border-indigo-900">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Promoh Logo" width={32} height={32} className="brightness-0 invert object-contain" />
            <span className="text-xl font-bold tracking-tight text-white">Promoh Admin</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-900 text-indigo-200 hover:text-white transition-colors text-sm font-medium"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-900">
          <div className="px-4 py-2 mb-2">
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Super Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-900/50 text-indigo-300 hover:text-red-300 transition-colors text-left text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
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
