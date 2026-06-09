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

export default function ProviderLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Verify they are actually a provider
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists() && userDoc.data().role !== "provider" && userDoc.data().role !== "admin") {
        await auth.signOut();
        setError("This account is not registered as a service provider.");
        setLoading(false);
        return;
      }

      router.push("/");
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Account temporarily locked.");
      } else {
        setError("Login failed. Please verify your details and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="Promoh" width={60} height={60} className="w-auto h-12" />
          </Link>
        </div>
        <Card className="border-secondary-200 bg-white text-secondary-900 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-secondary-900">Provider Login</CardTitle>
            <CardDescription className="text-secondary-500">Access your professional dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">Business Email</label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="contact@business.com"
                  className="bg-white border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus-visible:ring-primary-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-secondary-700">Password</label>
                  <Link href="/forgot-password" className="text-sm text-primary-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="bg-white border-secondary-300 text-secondary-900 focus-visible:ring-primary-500"
                />
              </div>
              <Button type="submit" className="w-full mt-6" isLoading={loading}>
                Log In
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-secondary-500">
              New provider? <Link href="/provider/register" className="text-primary-600 font-medium hover:underline">Apply here</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
