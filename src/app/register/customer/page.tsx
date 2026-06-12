"use client";

import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Eye, EyeOff } from "lucide-react";
import { COUNTRIES } from "@/lib/currencies";



function validatePassword(password: string) {
  return [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Uppercase letter (A-Z)", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter (a-z)", ok: /[a-z]/.test(password) },
    { label: "Number (0-9)", ok: /[0-9]/.test(password) },
    { label: "Special character (!@#$...)", ok: /[^A-Za-z0-9]/.test(password) },
  ];
}

export default function CustomerRegisterPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "", country: "US" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const pwRules = validatePassword(form.password);
  const pwValid = pwRules.every(r => r.ok);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pwValid) { setError("Please meet all password requirements."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      // Phone check removed to prevent timeout issues

      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const countryData = COUNTRIES.find(c => c.code === form.country);
      await Promise.all([
        updateProfile(cred.user, { displayName: `${form.firstName} ${form.lastName}` }),
        sendEmailVerification(cred.user),
        setDoc(doc(db, "users", cred.user.uid), {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone ? `${countryData?.dialCode || ""} ${form.phone}`.trim() : "",
          country: form.country,
          currency: countryData?.currency || "USD",
          role: "customer",
          emailVerified: false,
          createdAt: new Date().toISOString(),
        })
      ]);

      router.push("/");
    } catch (err: any) {
      const msgs: Record<string, string> = {
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/weak-password": "Password is too weak. Please use a stronger password.",
        "auth/network-request-failed": "Network error. Please check your internet connection.",
        "auth/operation-not-allowed": "Email sign-up is not enabled. Please contact support.",
      };
      setError(msgs[err.code] || (err.message?.includes("timed out") ? "Request timed out. Please try again." : "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <Link href="/"><Image src="/logo.png" alt="Promoh" width={56} height={56} className="w-auto h-12" /></Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Customer Account</CardTitle>
            <CardDescription>Join Promoh to find trusted professionals</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium block mb-1">First Name</label><Input value={form.firstName} onChange={set("firstName")} required placeholder="John" /></div>
                <div><label className="text-sm font-medium block mb-1">Last Name</label><Input value={form.lastName} onChange={set("lastName")} required placeholder="Doe" /></div>
              </div>
              <div><label className="text-sm font-medium block mb-1">Email</label><Input type="email" value={form.email} onChange={set("email")} required placeholder="name@example.com" /></div>
              <div>
                <label className="text-sm font-medium block mb-1">Phone Number</label>
                <div className="flex gap-2">
                  <select
                    value={form.country}
                    onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))}
                    className="w-28 flex h-10 rounded-xl border border-secondary-300 bg-transparent px-2 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name.length > 12 ? c.code : c.name} ({c.dialCode})</option>
                    ))}
                  </select>
                  <Input type="tel" value={form.phone} onChange={set("phone")} placeholder="555 000 0000" className="flex-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Password</label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} required className="pr-12" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400">
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 space-y-1">
                    {pwRules.map(rule => (
                      <div key={rule.label} className={`flex items-center gap-2 text-xs ${rule.ok ? "text-green-600" : "text-secondary-400"}`}>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${rule.ok ? "bg-green-500 border-green-500" : "border-secondary-300"}`}>
                          {rule.ok && <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        {rule.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div><label className="text-sm font-medium block mb-1">Confirm Password</label><Input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} required /></div>
              <Button type="submit" className="w-full mt-2" isLoading={loading}>Create Account</Button>
            </form>
            <p className="text-center mt-4 text-sm text-secondary-500">
              Already have an account? <Link href="/login" className="text-primary-600 font-medium hover:underline">Log in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
