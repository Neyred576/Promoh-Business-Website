"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  CheckCircle, CalendarCheck, ArrowLeft, Clock, MapPin,
  ShieldCheck, Star, User, FileText, DollarSign, AlertCircle
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Image from "next/image";
import { motion } from "framer-motion";

interface ProviderData {
  businessName: string;
  firstName: string;
  lastName: string;
  servicesOffered: string;
  hourlyRate: string;
  location: string;
  photoURL?: string;
  rating?: number;
  isVerified?: boolean;
  description?: string;
}

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

const STATUS_STEPS = [
  { key: "pending", label: "Pending", desc: "Awaiting provider confirmation" },
  { key: "accepted", label: "Accepted", desc: "Provider confirmed your booking" },
  { key: "in_progress", label: "In Progress", desc: "Service is being performed" },
  { key: "completed", label: "Completed", desc: "Service completed successfully" },
];

export default function NewBookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const providerId = searchParams.get("provider") || "";
  const { user } = useAuth();

  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [loadingProvider, setLoadingProvider] = useState(true);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!providerId) { setLoadingProvider(false); return; }
    getDoc(doc(db, "providers", providerId)).then(snap => {
      if (snap.exists()) setProvider(snap.data() as ProviderData);
      setLoadingProvider(false);
    });
  }, [providerId]);

  const services = provider?.servicesOffered?.split(",").map(s => s.trim()).filter(Boolean) || [];
  const today = new Date().toISOString().split("T")[0];
  const estimatedCost = provider?.hourlyRate ? `$${provider.hourlyRate}/hr` : "TBD";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setError("Please log in to book a service."); return; }
    if (!date) { setError("Please select a date."); return; }
    if (!time) { setError("Please select a time slot."); return; }
    setLoading(true);
    setError("");
    try {
      const bookingRef = await addDoc(collection(db, "bookings"), {
        customerId: user.uid,
        customerName: user.displayName || user.email,
        customerEmail: user.email,
        providerId,
        providerName: provider?.businessName || `${provider?.firstName} ${provider?.lastName}`,
        service: selectedService || provider?.servicesOffered || "General Service",
        date,
        time,
        notes,
        address,
        status: "pending",
        estimatedRate: provider?.hourlyRate || "0",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Notify provider
      await addDoc(collection(db, "notifications"), {
        userId: providerId,
        title: "📅 New Booking Request",
        message: `${user.displayName || "A customer"} has requested a booking for ${date} at ${time}.`,
        link: "/provider/dashboard",
        type: "booking_new",
        read: false,
        createdAt: new Date().toISOString(),
      });

      setBookingId(bookingRef.id);
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
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">Booking Submitted!</h1>
            <p className="text-secondary-600 mb-4">
              Your request has been sent to <strong>{provider?.businessName || "the provider"}</strong>.
              You'll receive a notification once they respond.
            </p>

            {/* Status pipeline */}
            <div className="my-8 space-y-3 text-left">
              {STATUS_STEPS.map((step, i) => (
                <div key={step.key} className={`flex items-center gap-3 p-3 rounded-xl border ${i === 0 ? "bg-amber-50 border-amber-200" : "bg-white border-secondary-100"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-400 text-white" : "bg-secondary-100 text-secondary-400"}`}>
                    {i === 0 ? "✓" : i + 1}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${i === 0 ? "text-amber-800" : "text-secondary-400"}`}>{step.label}</p>
                    <p className={`text-xs ${i === 0 ? "text-amber-600" : "text-secondary-300"}`}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Link href="/dashboard"><Button variant="outline">My Dashboard</Button></Link>
              <Link href={`/chat?provider=${providerId}`}><Button>Chat with Provider</Button></Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link href={`/provider/${providerId}`}
          className="flex items-center gap-2 text-secondary-500 hover:text-secondary-900 transition-colors mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Provider Profile
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CalendarCheck className="w-5 h-5 text-primary-600" /> Book a Service
                </CardTitle>
                <CardDescription>Fill in your preferred date, time, and any details for the provider.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </div>
                  )}
                  {!user && (
                    <div className="p-4 bg-amber-50 text-amber-700 text-sm rounded-xl border border-amber-200">
                      You must be logged in to book. <Link href="/login" className="font-semibold underline">Log in here</Link>.
                    </div>
                  )}

                  {/* Service Selection */}
                  {services.length > 1 && (
                    <div>
                      <label className="text-sm font-semibold block mb-2 text-secondary-700">
                        <FileText className="w-4 h-4 inline mr-1.5 text-primary-500" />Select Service
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {services.map(svc => (
                          <button
                            key={svc}
                            type="button"
                            onClick={() => setSelectedService(svc)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium border text-left transition-all ${selectedService === svc ? "bg-primary-50 border-primary-500 text-primary-700" : "border-secondary-200 hover:border-primary-300 text-secondary-700 bg-white"}`}
                          >
                            {svc}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div>
                    <label className="text-sm font-semibold block mb-2 text-secondary-700">
                      <CalendarCheck className="w-4 h-4 inline mr-1.5 text-primary-500" />Preferred Date
                    </label>
                    <Input
                      id="booking-date"
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                      min={today}
                      className="bg-white"
                    />
                  </div>

                  {/* Time Slots */}
                  <div>
                    <label className="text-sm font-semibold block mb-2 text-secondary-700">
                      <Clock className="w-4 h-4 inline mr-1.5 text-primary-500" />Preferred Time
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTime(slot)}
                          className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${time === slot ? "bg-primary-600 border-primary-600 text-white" : "border-secondary-200 hover:border-primary-400 text-secondary-700 bg-white"}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="text-sm font-semibold block mb-2 text-secondary-700">
                      <MapPin className="w-4 h-4 inline mr-1.5 text-primary-500" />Service Address (optional)
                    </label>
                    <Input
                      id="booking-address"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Enter the address where service is needed..."
                      className="bg-white"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm font-semibold block mb-2 text-secondary-700">
                      <FileText className="w-4 h-4 inline mr-1.5 text-primary-500" />Notes for Provider (optional)
                    </label>
                    <textarea
                      id="booking-notes"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Describe the job, any special requirements, or questions..."
                      rows={4}
                      className="flex w-full rounded-xl border border-secondary-300 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:border-primary-500 focus-visible:ring-primary-500/20 placeholder:text-secondary-400 resize-none"
                    />
                    <p className="text-xs text-secondary-400 mt-1">{notes.length}/500 characters</p>
                  </div>

                  <Button id="confirm-booking-btn" type="submit" className="w-full" size="lg" isLoading={loading} disabled={!user || !date || !time}>
                    <CalendarCheck className="w-5 h-5 mr-2" />
                    {!date || !time ? "Select Date & Time to Continue" : "Confirm Booking Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Provider Summary Sidebar */}
          <div>
            <Card className="sticky top-28">
              <CardContent className="p-6 space-y-4">
                {loadingProvider ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-20 bg-secondary-100 rounded-xl" />
                    <div className="h-4 bg-secondary-100 rounded" />
                    <div className="h-4 bg-secondary-100 rounded w-2/3" />
                  </div>
                ) : provider ? (
                  <>
                    {/* Provider mini card */}
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-primary-400 to-indigo-400 flex items-center justify-center shrink-0">
                        {provider.photoURL ? (
                          <Image src={provider.photoURL} alt={provider.businessName} width={56} height={56} className="object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-white">
                            {(provider.businessName || provider.firstName || "?")[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-secondary-900 text-sm">
                          {provider.businessName || `${provider.firstName} ${provider.lastName}`}
                        </p>
                        {provider.isVerified && (
                          <span className="flex items-center gap-1 text-xs text-primary-600 font-medium">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                        {provider.rating && (
                          <span className="flex items-center gap-1 text-xs text-secondary-500">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            {provider.rating.toFixed(1)} rating
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-secondary-100 pt-4 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-secondary-500 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Rate
                        </span>
                        <span className="font-bold text-primary-700">{estimatedCost}</span>
                      </div>
                      {date && (
                        <div className="flex justify-between">
                          <span className="text-secondary-500 flex items-center gap-1">
                            <CalendarCheck className="w-3.5 h-3.5" /> Date
                          </span>
                          <span className="font-medium">{new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                        </div>
                      )}
                      {time && (
                        <div className="flex justify-between">
                          <span className="text-secondary-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Time
                          </span>
                          <span className="font-medium">{time}</span>
                        </div>
                      )}
                      {selectedService && (
                        <div className="flex justify-between">
                          <span className="text-secondary-500 flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> Service
                          </span>
                          <span className="font-medium text-right max-w-[120px] truncate">{selectedService}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                      💡 The provider will confirm your request. Payment is collected after the service is completed.
                    </div>
                  </>
                ) : (
                  <p className="text-secondary-500 text-sm text-center py-4">Provider not found.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
