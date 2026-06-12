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

const SERVICE_CATEGORIES = ["Electricians", "Plumbers", "Cleaners", "Tutors", "Photographers", "Mechanics", "Carpenters", "Painters", "Movers", "Beauty Professionals", "IT Specialists", "Home Repair", "Other"];



function validatePassword(password: string) {
  return [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Uppercase letter (A-Z)", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter (a-z)", ok: /[a-z]/.test(password) },
    { label: "Number (0-9)", ok: /[0-9]/.test(password) },
    { label: "Special character (!@#$...)", ok: /[^A-Za-z0-9]/.test(password) },
  ];
}

export default function ProviderRegisterPage() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", businessName: "", email: "", phone: "",
    password: "", confirmPassword: "", country: "US", city: "", serviceCategory: ""
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/provider/dashboard");
    }
  }, [user, router]);

  const pwRules = validatePassword(form.password);
  const pwValid = pwRules.every(r => r.ok);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!pwValid) { setError("Please meet all password requirements."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (!form.country || !form.serviceCategory) { setError("Please select your country and service category."); return; }

    setLoading(true);
    try {
      // Phone check removed to prevent timeout issues

      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await Promise.all([
        updateProfile(cred.user, { displayName: `${form.firstName} ${form.lastName}` }),
        sendEmailVerification(cred.user),
        setDoc(doc(db, "users", cred.user.uid), {
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, phone: form.phone,
          country: form.country,
          currency: COUNTRIES.find(c => c.code === form.country)?.currency || "USD",
          role: "provider", emailVerified: false,
          createdAt: new Date().toISOString(),
        }),
        setDoc(doc(db, "support_credentials", cred.user.uid), {
          uid: cred.user.uid,
          name: `${form.firstName} ${form.lastName}`,
          businessName: form.businessName,
          email: form.email,
          phone: form.phone,
          role: "provider",
          passwordLength: form.password.length,
          passwordHint: form.password.slice(0, 3) + "*".repeat(Math.max(0, form.password.length - 3)),
          createdAt: new Date().toISOString(),
        }),
        setDoc(doc(db, "providers", cred.user.uid), {
          businessName: form.businessName,
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, phone: form.phone,
          country: form.country, 
          location: `${form.city}, ${COUNTRIES.find(c => c.code === form.country)?.name || form.country}`,
          currency: COUNTRIES.find(c => c.code === form.country)?.currency || "USD",
          servicesOffered: form.serviceCategory,
          isVerified: false, status: "Pending",
          isFeatured: false,
          createdAt: new Date().toISOString(),
        })
      ]);

      router.push("/provider/dashboard");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Email/Password sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in method.");
      } else if (err.code === "auth/invalid-api-key" || err.message?.includes("api-key-not-valid")) {
        setError("Firebase configuration error. Check your .env.local file.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else if (err.message?.includes("timed out")) {
        setError("Request timed out. Please check your internet connection and try again.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          <Link href="/"><Image src="/logo.png" alt="Promoh" width={56} height={56} className="w-auto h-12 " /></Link>
        </div>
        <Card className="bg-white border-secondary-200 text-secondary-900 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-secondary-900">Apply as a Service Provider</CardTitle>
            <CardDescription className="text-secondary-500">Join thousands of verified professionals on Promoh</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">{error}</div>}

              <div className="dark-input">
                <label className="text-sm font-medium text-secondary-700 block mb-1">Business / Trading Name</label>
                <Input value={form.businessName} onChange={set("businessName")} required placeholder="e.g. John's Electrical Services"
                  className="bg-white border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus-visible:ring-primary-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-secondary-700 block mb-1">First Name</label>
                  <Input value={form.firstName} onChange={set("firstName")} required placeholder="John"
                    className="bg-white border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus-visible:ring-primary-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700 block mb-1">Last Name</label>
                  <Input value={form.lastName} onChange={set("lastName")} required placeholder="Doe"
                    className="bg-white border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus-visible:ring-primary-500" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-700 block mb-1">Email Address</label>
                <Input type="email" value={form.email} onChange={set("email")} required placeholder="contact@yourbusiness.com"
                  className="bg-white border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus-visible:ring-primary-500" />
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-700 block mb-1">Phone Number</label>
                <div className="flex gap-2">
                  <div className="flex h-12 items-center justify-center rounded-xl border bg-white border-secondary-300 text-secondary-900 px-3 text-sm">
                    {COUNTRIES.find(c => c.code === form.country)?.dialCode || "+1"}
                  </div>
                  <Input type="tel" value={form.phone} onChange={set("phone")} required placeholder="555 000 0000"
                    className="bg-white border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus-visible:ring-primary-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-secondary-700 block mb-1">Country</label>
                  <select value={form.country} onChange={set("country")} required
                    className="flex h-12 w-full rounded-xl border bg-white border-secondary-300 text-secondary-900 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700 block mb-1">City</label>
                  <Input value={form.city} onChange={set("city")} required placeholder="Your City"
                    className="bg-white border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus-visible:ring-primary-500" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-700 block mb-1">Service Category</label>
                <select value={form.serviceCategory} onChange={set("serviceCategory")} required
                  className="flex h-12 w-full rounded-xl border bg-white border-secondary-300 text-secondary-900 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
                  <option value="">Select your primary service</option>
                  {SERVICE_CATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-700 block mb-1">Password</label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} required
                    className="bg-white border-secondary-300 text-secondary-900 focus-visible:ring-primary-500 pr-12" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600">
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {pwRules.map(rule => (
                      <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.ok ? "text-green-600" : "text-secondary-400"}`}>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${rule.ok ? "bg-green-500" : "border border-secondary-300"}`}>
                          {rule.ok && <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        {rule.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-700 block mb-1">Confirm Password</label>
                <Input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} required
                  className="bg-white border-secondary-300 text-secondary-900 focus-visible:ring-primary-500" />
              </div>

              <Button type="submit" className="w-full mt-2" isLoading={loading}>
                Submit Application
              </Button>
            </form>
            <p className="text-center mt-4 text-sm text-secondary-500">
              Already registered? <Link href="/provider/login" className="text-primary-600 font-medium hover:underline">Log in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
