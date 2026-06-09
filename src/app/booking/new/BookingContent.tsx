"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase/client";
import { collection, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircle, CalendarCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export default function NewBookingContent() {
  const searchParams = useSearchParams();
  const providerId = searchParams.get("provider") || "";
  const { user } = useAuth();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setError("Please log in to book a service."); return; }
    setLoading(true);
    try {
      const newBooking = await addDoc(collection(db, "bookings"), {
        customerId: user.uid,
        customerName: user.displayName,
        customerEmail: user.email,
        providerId,
        date,
        time,
        notes,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      // Notification to Provider
      await addDoc(collection(db, "notifications"), {
        userId: providerId,
        title: "New Booking Request",
        message: `${user.displayName} has requested a booking for ${date} at ${time}.`,
        link: "/provider/dashboard",
        read: false,
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
    } catch (err: any) {
      setError("Failed to submit booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">Booking Submitted!</h1>
          <p className="text-secondary-600 mb-8">Your request has been sent to the provider. You'll receive a confirmation once they accept.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard"><Button variant="outline">My Dashboard</Button></Link>
            <Link href="/search"><Button>Find More Pros</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-10">
        <Link href={`/provider/${providerId}`}
          className="flex items-center gap-2 text-secondary-500 hover:text-secondary-900 transition-colors mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Provider
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary-600" /> Book a Service
            </CardTitle>
            <CardDescription>Fill in your preferred date, time, and any notes for the provider.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">{error}</div>}
              {!user && (
                <div className="p-3 bg-amber-50 text-amber-700 text-sm rounded-xl border border-amber-200">
                  You must be logged in to book. <Link href="/login" className="font-semibold underline">Log in here</Link>.
                </div>
              )}
              <div>
                <label className="text-sm font-medium block mb-1">Preferred Date</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Preferred Time</label>
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Notes for Provider (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Describe the job, address, or any special instructions..."
                  className="flex min-h-[100px] w-full rounded-xl border border-secondary-300 bg-transparent px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:border-primary-500 focus-visible:ring-primary-500/20 placeholder:text-secondary-400"
                />
              </div>
              <Button type="submit" className="w-full" isLoading={loading} disabled={!user}>
                Confirm Booking Request
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
