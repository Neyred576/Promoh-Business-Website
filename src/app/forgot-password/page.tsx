"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="Promoh" width={60} height={60} className="w-auto h-12" />
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>Enter your email to receive a password reset link.</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center space-y-4">
                <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
                  Password reset link has been sent to your email! Please check your inbox.
                </div>
                <Link href="/login">
                  <Button className="w-full mt-4" variant="outline">Back to Log In</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg">{error}</div>}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    placeholder="name@example.com"
                  />
                </div>
                <Button type="submit" className="w-full" isLoading={loading}>
                  Send Reset Link
                </Button>
                <div className="mt-4 text-center text-sm text-secondary-600">
                  Remembered your password? <Link href="/login" className="text-primary-600 font-medium hover:underline">Log in</Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
