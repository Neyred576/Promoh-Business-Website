"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { ShieldCheck, Menu, X, MessageSquare } from "lucide-react";
import Notifications from "./Notifications";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => { await signOut(); };

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Promoh Logo" width={40} height={40} className="w-auto h-10 object-contain" />
          <span className="text-2xl font-bold text-primary-600 tracking-tight hidden sm:block">Promoh</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 font-medium text-sm">
          <Link href="/search" className="hover:text-primary-600 transition-colors">Find Professionals</Link>
          <Link href="/register/provider" className="hover:text-primary-600 transition-colors">Become a Provider</Link>
          {user ? (
            <>
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="px-2">
                  <MessageSquare className="w-5 h-5 text-secondary-600" />
                </Button>
              </Link>
              <Notifications />
              <Link href={user.role === "admin" ? "/admin/dashboard" : user.role === "provider" ? "/provider/dashboard" : "/dashboard"}>
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>Log Out</Button>
            </>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost">Log In</Button></Link>
              <Link href="/register"><Button>Sign Up</Button></Link>
            </>
          )}
        </div>
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-3">
          <Link href="/search" className="block py-2 hover:text-primary-600" onClick={() => setMobileOpen(false)}>Find Professionals</Link>
          <Link href="/provider/register" className="block py-2 hover:text-primary-600" onClick={() => setMobileOpen(false)}>Become a Provider</Link>
          {user ? (
            <Button variant="outline" className="w-full" onClick={handleSignOut}>Log Out</Button>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full">Log In</Button></Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}><Button className="w-full">Sign Up</Button></Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
