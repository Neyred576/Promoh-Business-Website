"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  CreditCard, ShieldCheck, Lock, CheckCircle, AlertCircle,
  Calendar, Clock, DollarSign, ArrowLeft, Loader2
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CURRENCIES, formatCurrency } from "@/lib/currencies";

const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "KES", "NGN", "ZAR", "CAD", "AUD", "INR", "AED"];

export default function PaymentPage() {
  const { bookingId } = useParams() as { bookingId: string };
  const { user, loading } = useAuth();
  const router = useRouter();

  const [booking, setBooking] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [customAmount, setCustomAmount] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!bookingId) return;
    getDoc(doc(db, "bookings", bookingId)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setBooking({ id: snap.id, ...data });
        setCustomAmount(data.amount || data.estimatedRate || "0");
      }
      setFetching(false);
    });
  }, [bookingId]);

  const handlePayment = async () => {
    setProcessing(true);
    setError("");
    try {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");

      const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      const isRealStripe = stripeKey && stripeKey !== "your_stripe_publishable_key";

      // Create payment intent
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: selectedCurrency,
          bookingId,
          customerId: user?.uid,
          providerId: booking?.providerId,
        }),
      });
      const data = await res.json();

      if (data.demo || !isRealStripe) {
        // Demo mode - simulate successful payment
        await updateDoc(doc(db, "bookings", bookingId), {
          paymentStatus: "paid",
          amount: amount,
          currency: selectedCurrency,
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setSuccess(true);
        return;
      }

      // Real Stripe - load Stripe.js
      const { loadStripe } = await import("@stripe/stripe-js");
      const stripe = await loadStripe(stripeKey);
      if (!stripe) throw new Error("Stripe failed to load");

      // Redirect to Stripe checkout or handle inline
      const { error: stripeError } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: {} as any },
      });

      if (stripeError) throw new Error(stripeError.message);

      await updateDoc(doc(db, "bookings", bookingId), {
        paymentStatus: "paid",
        amount,
        currency: selectedCurrency,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-secondary-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">Payment Successful!</h1>
          <p className="text-secondary-600 mb-2">
            {formatCurrency(parseFloat(customAmount), selectedCurrency)} has been paid for your booking.
          </p>
          <p className="text-sm text-secondary-400 mb-8">The provider will be notified of your payment.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard"><Button>Back to Dashboard</Button></Link>
          </div>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/dashboard" className="flex items-center gap-2 text-secondary-500 hover:text-secondary-900 text-sm font-medium mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="grid gap-6">
          {/* Booking Summary */}
          {booking && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-500 flex items-center gap-1.5"><Calendar className="w-4 h-4" />Date</span>
                  <span className="font-medium">{booking.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500 flex items-center gap-1.5"><Clock className="w-4 h-4" />Time</span>
                  <span className="font-medium">{booking.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" />Service</span>
                  <span className="font-medium">{booking.service || "General Service"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Provider</span>
                  <span className="font-medium">{booking.providerName || "Provider"}</span>
                </div>
                <div className="flex justify-between border-t pt-3 mt-2">
                  <span className="font-semibold">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${booking.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {booking.paymentStatus || "Unpaid"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-primary-600" /> Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}

              {/* Currency */}
              <div>
                <label className="text-sm font-semibold block mb-2 text-secondary-700">Currency</label>
                <div className="grid grid-cols-5 gap-2">
                  {SUPPORTED_CURRENCIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCurrency(c)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${selectedCurrency === c ? "bg-primary-600 border-primary-600 text-white" : "border-secondary-200 hover:border-primary-400 text-secondary-700 bg-white"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-sm font-semibold block mb-2 text-secondary-700">
                  <DollarSign className="w-4 h-4 inline mr-1" />Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500 font-semibold text-sm">
                    {CURRENCIES[selectedCurrency as keyof typeof CURRENCIES]?.symbol || "$"}
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-secondary-300 bg-white text-sm font-semibold focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              {/* Payment methods */}
              <div>
                <label className="text-sm font-semibold block mb-2 text-secondary-700">Pay with</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary-500 bg-primary-50">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-primary-700">Credit / Debit Card (Stripe)</span>
                    <span className="ml-auto text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-secondary-200 opacity-60">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">PP</span>
                    </div>
                    <span className="text-sm font-semibold text-secondary-500">PayPal</span>
                    <span className="ml-auto text-xs bg-secondary-100 text-secondary-500 px-2 py-0.5 rounded-full">Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* Security note */}
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Payments are processed securely via Stripe. Your card details are never stored.</span>
              </div>

              <Button
                id="pay-now-btn"
                className="w-full"
                size="lg"
                onClick={handlePayment}
                isLoading={processing}
                disabled={!customAmount || parseFloat(customAmount) <= 0}
              >
                {processing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><CreditCard className="w-4 h-4 mr-2" /> Pay {formatCurrency(parseFloat(customAmount) || 0, selectedCurrency)}</>
                )}
              </Button>

              <p className="text-xs text-secondary-400 text-center">
                By completing payment, you agree to our <Link href="/terms" className="underline">Terms of Service</Link>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
