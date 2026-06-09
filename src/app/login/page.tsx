"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out.`)), ms)
    ),
  ]);
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      try {
        const userDoc = await withTimeout(getDoc(doc(db, "users", cred.user.uid)), 8000, "Firestore");
        const role = userDoc.exists() ? userDoc.data().role : "customer";
        if (role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
      } catch {
        router.push("/");
      }
    } catch (err: any) {
      const msgs: Record<string, string> = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/too-many-requests": "Too many failed attempts. Please try again later.",
        "auth/invalid-api-key": "Service configuration error. Please contact support.",
        "auth/operation-not-allowed": "Email sign-in is not enabled.",
        "auth/network-request-failed": "Network error. Check your internet connection.",
      };
      setError(msgs[err.code] || "Login failed. Please verify your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/"><Image src="/logo.png" alt="Promoh" width={56} height={56} className="w-auto h-12" /></Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Log in to your Promoh account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
              <div>
                <label className="text-sm font-medium block mb-1">Email Address</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@example.com" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Password</label>
                  <Link href="/forgot-password" className="text-sm text-primary-600 hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required className="pr-12" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400">
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" isLoading={loading}>Log In</Button>
            </form>

            <div className="mt-6 text-center text-sm text-secondary-600 space-y-2">
              <p>Don't have an account? <Link href="/register" className="text-primary-600 font-medium hover:underline">Sign Up</Link></p>
              <p><Link href="/provider/login" className="text-secondary-400 hover:text-secondary-700 transition-colors">I'm a Service Provider →</Link></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
