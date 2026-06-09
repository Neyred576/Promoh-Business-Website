"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot, doc, orderBy, limit, updateDoc, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ShieldAlert, TrendingUp, Calendar, Star } from "lucide-react";
import { formatCurrency } from "@/lib/currencies";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ProviderDashboardPage() {
  const { user } = useAuth();
  const [providerData, setProviderData] = useState<any>(null);
  const [earnings, setEarnings] = useState(0);
  const [activeBookings, setActiveBookings] = useState(0);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateBooking = async (id: string, newStatus: string, customerId: string, amount?: number) => {
    setUpdatingId(id);
    try {
      const updates: any = { status: newStatus };
      if (amount) updates.amount = amount;
      await updateDoc(doc(db, "bookings", id), updates);

      // Notification to Customer
      await addDoc(collection(db, "notifications"), {
        userId: customerId,
        title: "Booking Update",
        message: `Your booking status has been updated to: ${newStatus}`,
        link: "/dashboard",
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating booking", error);
      alert("Failed to update booking status");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    const unsubProvider = onSnapshot(doc(db, "providers", user.uid), (doc) => {
      if (doc.exists()) setProviderData(doc.data());
    });

    const bookingsQ = query(
      collection(db, "bookings"),
      where("providerId", "==", user.uid)
    );

    const unsubBookings = onSnapshot(bookingsQ, (snapshot) => {
      let total = 0;
      let active = 0;
      let allBookings: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        allBookings.push({ id: doc.id, ...data });
        
        if (data.status === "completed") {
          total += Number(data.amount || 0);
        }
        if (data.status === "pending" || data.status === "active" || data.status === "accepted") {
          active++;
        }
      });

      // Sort recent requests locally since we queried without orderBy (requires compound index otherwise)
      allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setEarnings(total);
      setActiveBookings(active);
      setRecentRequests(allBookings.slice(0, 5));
    });

    return () => {
      unsubProvider();
      unsubBookings();
    };
  }, [user?.uid]);

  const currency = providerData?.currency || "USD";
  const rating = providerData?.rating ? providerData.rating.toFixed(1) : "New";

  const isProfileComplete = providerData?.photoURL && providerData?.servicesOffered && providerData?.hourlyRate;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {providerData?.firstName || user?.displayName?.split(' ')[0] || "Provider"}</h1>
          <p className="text-secondary-600 mt-1">Here is what is happening with your business today.</p>
        </div>
        {!user?.isVerified && (
          <div className="flex items-center gap-3 bg-amber-50 text-amber-800 px-4 py-3 rounded-xl border border-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <div className="text-sm font-medium">Your account is pending verification.</div>
            <Link href="/provider/dashboard/verification">
              <Button size="sm" variant="outline" className="ml-2 bg-white text-amber-900 border-amber-300 hover:bg-amber-50">Verify Now</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <p className="text-sm text-secondary-500 font-medium">Total Earnings</p>
            <h3 className="text-3xl font-bold mt-1">{formatCurrency(earnings, currency)}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-secondary-600 bg-secondary-100 px-2 py-1 rounded-full">This Week</span>
            </div>
            <p className="text-sm text-secondary-500 font-medium">Active Bookings</p>
            <h3 className="text-3xl font-bold mt-1">{activeBookings}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                <Star className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-secondary-600 bg-secondary-100 px-2 py-1 rounded-full">Overall</span>
            </div>
            <p className="text-sm text-secondary-500 font-medium">Profile Rating</p>
            <h3 className="text-3xl font-bold mt-1">{rating}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>{recentRequests.length === 0 ? "You have no new booking requests." : "Your latest booking activity."}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="h-48 border-2 border-dashed border-secondary-200 rounded-xl flex items-center justify-center text-secondary-400">
                No requests to show
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map(req => (
                  <div key={req.id} className="p-4 border border-secondary-200 rounded-xl flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium text-secondary-900">{req.service || "Booking Request"}</div>
                      <div className="text-sm text-secondary-500">{new Date(req.createdAt).toLocaleDateString()}</div>
                      <div className="text-sm text-secondary-600 mt-1"><span className="font-medium">Customer:</span> {req.customerName}</div>
                      {req.notes && <div className="text-xs text-secondary-500 mt-1 italic">"{req.notes}"</div>}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-xs font-medium capitalize px-2 py-1 rounded-lg ${
                        req.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        req.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                        req.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {req.status}
                      </span>
                      {req.status === "Pending" || req.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50"
                            isLoading={updatingId === req.id} onClick={() => handleUpdateBooking(req.id, "accepted", req.customerId)}>Accept</Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                            isLoading={updatingId === req.id} onClick={() => handleUpdateBooking(req.id, "rejected", req.customerId)}>Reject</Button>
                        </div>
                      ) : (req.status === "accepted" || req.status === "active") ? (
                        <Button size="sm" className="bg-primary-600 hover:bg-primary-700"
                          isLoading={updatingId === req.id} onClick={() => {
                            const val = prompt("Enter final charge amount to complete this booking:", providerData?.hourlyRate || "0");
                            if (val !== null && !isNaN(Number(val))) {
                              handleUpdateBooking(req.id, "completed", req.customerId, Number(val));
                            }
                          }}>
                          Mark Complete
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Profile Completion</CardTitle>
            <CardDescription>Complete your profile to attract more customers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Profile Photo</span>
              <span className={providerData?.photoURL ? "text-green-600" : "text-amber-600"}>{providerData?.photoURL ? "Done" : "Missing"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Services & Pricing</span>
              <span className={providerData?.servicesOffered && providerData?.hourlyRate ? "text-green-600" : "text-amber-600"}>
                {providerData?.servicesOffered && providerData?.hourlyRate ? "Done" : "Missing"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Identity Verification</span>
              <span className={user?.isVerified ? "text-green-600" : "text-red-600"}>{user?.isVerified ? "Verified" : "Required"}</span>
            </div>
            <div className="pt-4">
              <Link href="/provider/dashboard/profile">
                <Button className="w-full" variant={isProfileComplete ? "outline" : "default"}>
                  {isProfileComplete ? "Edit Profile" : "Complete Profile"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
