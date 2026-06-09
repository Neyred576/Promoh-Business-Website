"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eye, EyeOff, ShieldAlert, Shield } from "lucide-react";
import Image from "next/image";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // If already authenticated, skip login and go straight to dashboard
  useEffect(() => {
    if (getCookie("admin_session") === "authenticated") {
      router.replace("/admin/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Small delay for UX
    await new Promise(r => setTimeout(r, 400));

    if (password === "Mohteeflair@090021") {
      // Set secure cookie valid for 8 hours
      document.cookie = "admin_session=authenticated; path=/; max-age=28800; SameSite=Strict";
      router.push("/admin/dashboard");
    } else {
      setError("Incorrect master password. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <Image src="/logo.png" alt="Promoh Admin" width={56} height={56} className="w-auto h-12 brightness-0 invert" />
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>Restricted Access Portal</span>
          </div>
        </div>

        <Card className="bg-slate-800 border-slate-700 text-slate-50 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-white">Admin Login</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your master password to access the control center.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-900/50 text-red-200 text-sm rounded-xl border border-red-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  Master Password
                </label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                    placeholder="Enter master password"
                    className="pr-12 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                isLoading={loading}
              >
                <Shield className="w-4 h-4 mr-2" />
                Access Dashboard
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-700 text-center">
              <a href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                ← Back to Promoh
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
