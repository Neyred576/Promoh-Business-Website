"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Heart, Clock, Star, MapPin, ShieldCheck, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ReviewModal from "@/components/reviews/ReviewModal";

export default function CustomerDashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
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
        if (data.status === "pending" || data.status === "active" || data.status === "accepted") {
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

  if (loading || !user) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
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
          <p className="text-secondary-500 mt-1">Find and book trusted professionals from your dashboard.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Link href="/search">
            <Card className="cursor-pointer hover:border-primary-500 hover:shadow-lg transition-all group">
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

          <Card className="cursor-pointer hover:border-red-400 hover:shadow-lg transition-all group">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
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

          <Card className="cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all group">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-secondary-900">My Bookings</h3>
                  <p className="text-sm text-secondary-500">Active appointments</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-secondary-900">{activeBookings}</div>
            </CardContent>
          </Card>
        </div>

        {/* My Bookings */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>My Recent Bookings</CardTitle>
            <CardDescription>Track the status of your service requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {allBookings.length === 0 ? (
              <div className="h-32 border-2 border-dashed border-secondary-200 rounded-xl flex items-center justify-center text-secondary-400">
                You haven't booked any services yet.
              </div>
            ) : (
              <div className="space-y-4">
                {allBookings.slice(0, 5).map(booking => (
                  <div key={booking.id} className="p-4 border border-secondary-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-medium text-secondary-900">Booking with Provider</div>
                      <div className="text-sm text-secondary-500">{new Date(booking.createdAt).toLocaleDateString()} at {booking.time}</div>
                      {booking.notes && <div className="text-xs text-secondary-500 mt-1">"{booking.notes}"</div>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs font-medium capitalize px-2 py-1 rounded-lg ${
                        booking.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        booking.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                      {booking.amount && <div className="text-sm font-bold">${booking.amount}</div>}
                      {booking.status === 'completed' && !booking.reviewed && (
                        <Button size="sm" variant="outline" className="mt-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          onClick={() => setActiveReview(booking)}>
                          Leave Review
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>My Account</CardTitle>
            <CardDescription>Your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                {(user.displayName || user.email || "?")[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-secondary-900">{user.displayName || "Customer"}</h3>
                <p className="text-secondary-500">{user.email}</p>
                <span className="inline-flex items-center gap-1 text-xs text-primary-700 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-full mt-1">
                  <ShieldCheck className="w-3 h-3" /> Customer Account
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-8 p-8 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Need a professional today?</h2>
          <p className="text-primary-100 mb-6">Browse hundreds of verified experts in your area.</p>
          <Link href="/search">
            <Button className="bg-white text-primary-700 hover:bg-primary-50 font-bold px-8">
              <Search className="w-4 h-4 mr-2" /> Search Now
            </Button>
          </Link>
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
