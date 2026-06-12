"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Heart, Clock, Star, MapPin, ShieldCheck, LogOut, MessageSquare, XCircle, CreditCard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ReviewModal from "@/components/reviews/ReviewModal";
import { motion } from "framer-motion";

export default function CustomerDashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeBookings, setActiveBookings] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [activeReview, setActiveReview] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "customer") router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setSavedCount(data.savedProviders?.length || 0);
      }
    });

    const bookingsQ = query(collection(db, "bookings"), where("customerId", "==", user.uid));
    const unsubBookings = onSnapshot(bookingsQ, (snapshot) => {
      let active = 0;
      let bookings: any[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        bookings.push({ id: docSnap.id, ...data });
        if (data.status === "pending" || data.status === "accepted" || data.status === "in_progress") {
          active++;
        }
      });
      bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllBookings(bookings);
      setActiveBookings(active);
    });

    return () => {
      unsubUser();
      unsubBookings();
    };
  }, [user?.uid]);

  const handleSignOut = async () => { await signOut(); router.push("/"); };

  const cancelBooking = async (booking: any) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await updateDoc(doc(db, "bookings", booking.id), {
        status: "cancelled",
        updatedAt: new Date().toISOString()
      });
      // Notify provider
      await addDoc(collection(db, "notifications"), {
        userId: booking.providerId,
        title: "🚫 Booking Cancelled",
        message: `${user?.displayName || "The customer"} has cancelled the booking for ${booking.date}.`,
        link: "/provider/dashboard",
        type: "booking_update",
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error cancelling booking:", err);
    }
  };

  if (loading || !user) return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary-50 pb-20">
      {/* Customer Nav */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Promoh" width={32} height={32} className="w-auto h-8 object-contain" />
            <span className="text-xl font-bold text-primary-600 hidden sm:block">Promoh</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/search"><Button variant="ghost" size="sm"><Search className="w-4 h-4 mr-1" /> Find Pros</Button></Link>
            <button onClick={handleSignOut} className="flex items-center gap-2 text-secondary-500 hover:text-secondary-900 text-sm font-medium transition-colors">
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">
            Welcome back, {user.displayName?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-secondary-500 mt-1">Manage your bookings and saved professionals from your dashboard.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Link href="/search">
            <Card className="cursor-pointer hover:border-primary-500 hover:shadow-lg transition-all group border-transparent">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-secondary-900">Find Professionals</h3>
                  <p className="text-sm text-secondary-500">Browse verified experts</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/favorites">
            <Card className="cursor-pointer hover:border-rose-400 hover:shadow-lg transition-all group border-transparent">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary-900">Saved Providers</h3>
                    <p className="text-sm text-secondary-500">Your favorites list</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-secondary-900">{savedCount}</div>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-transparent shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-secondary-900">Active Bookings</h3>
                  <p className="text-sm text-secondary-500">Upcoming appointments</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-secondary-900">{activeBookings}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Bookings */}
            <Card>
              <CardHeader className="border-b border-secondary-100 pb-4">
                <CardTitle className="text-lg flex items-center justify-between">
                  My Bookings
                  <span className="text-xs font-medium bg-secondary-100 text-secondary-600 px-2.5 py-1 rounded-full">
                    {allBookings.length} Total
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {allBookings.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center text-secondary-400">
                    <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8 text-secondary-300" />
                    </div>
                    <p className="font-medium text-secondary-900">No bookings yet</p>
                    <p className="text-sm mt-1 mb-4">You haven't booked any services on Promoh yet.</p>
                    <Link href="/search"><Button size="sm">Explore Services</Button></Link>
                  </div>
                ) : (
                  <div className="divide-y divide-secondary-100">
                    {allBookings.map((booking, index) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={booking.id}
                        className="p-5 hover:bg-secondary-50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-secondary-900">{booking.providerName}</span>
                              <Link href={`/provider/${booking.providerId}`} className="text-xs text-primary-600 hover:underline">
                                Profile
                              </Link>
                            </div>
                            <p className="text-sm text-secondary-600 font-medium">{booking.service}</p>
                            
                            <div className="flex items-center gap-4 mt-3 text-xs text-secondary-500">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(booking.date + "T12:00:00").toLocaleDateString()} at {booking.time}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{booking.address || "No address provided"}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                              booking.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              booking.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                              booking.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                              booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status.replace("_", " ")}
                            </span>
                            
                            <div className="flex items-center gap-2 mt-2">
                              {/* Chat Action */}
                              <Link href={`/chat?provider=${booking.providerId}`}>
                                <Button size="sm" variant="outline" className="h-8 px-2 text-secondary-600">
                                  <MessageSquare className="w-4 h-4 mr-1.5" /> Chat
                                </Button>
                              </Link>

                              {/* Pay Action (if completed/accepted and unpaid) */}
                              {booking.status === 'completed' && booking.paymentStatus !== "paid" && (
                                <Link href={`/payment/${booking.id}`}>
                                  <Button size="sm" className="h-8 px-3 bg-green-600 hover:bg-green-700">
                                    <CreditCard className="w-4 h-4 mr-1.5" /> Pay Now
                                  </Button>
                                </Link>
                              )}

                              {/* Review Action */}
                              {booking.status === 'completed' && !booking.reviewed && (
                                <Button size="sm" className="h-8 px-3" onClick={() => setActiveReview(booking)}>
                                  <Star className="w-4 h-4 mr-1.5" /> Review
                                </Button>
                              )}

                              {/* Cancel Action */}
                              {booking.status === 'pending' && (
                                <Button size="sm" variant="ghost" className="h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => cancelBooking(booking)}>
                                  <XCircle className="w-4 h-4 mr-1.5" /> Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader className="pb-3 border-b border-secondary-100">
                <CardTitle className="text-lg">My Account</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                    {(user.displayName || user.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-secondary-900 truncate">{user.displayName || "Customer"}</h3>
                    <p className="text-secondary-500 text-sm truncate">{user.email}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full mt-1.5">
                      <ShieldCheck className="w-3 h-3" /> Customer
                    </span>
                  </div>
                </div>
                <div className="border-t border-secondary-100 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-secondary-600">
                    <span>Member Since</span>
                    <span className="font-medium text-secondary-900">2026</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Need Help */}
            <Card className="bg-gradient-to-br from-primary-600 to-indigo-700 text-white border-transparent overflow-hidden relative">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <CardContent className="p-6 relative z-10">
                <h3 className="text-lg font-bold mb-2">Need Assistance?</h3>
                <p className="text-primary-100 text-sm mb-4">Our AI assistant and support team are here to help you.</p>
                <div className="space-y-2">
                  <Button className="w-full bg-white text-primary-700 hover:bg-primary-50 font-semibold shadow-md">
                    Open Support Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {activeReview && (
        <ReviewModal
          bookingId={activeReview.id}
          providerId={activeReview.providerId}
          customerId={user.uid}
          customerName={user.displayName || "Customer"}
          onClose={() => setActiveReview(null)}
          onSuccess={() => setActiveReview(null)}
        />
      )}
    </div>
  );
}
