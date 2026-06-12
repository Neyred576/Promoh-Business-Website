"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ShieldAlert, TrendingUp, Calendar, Star, MessageSquare, CheckCircle, XCircle, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/currencies";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

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
      const updates: any = { status: newStatus, updatedAt: new Date().toISOString() };
      if (amount !== undefined) updates.amount = amount;
      await updateDoc(doc(db, "bookings", id), updates);

      // Notification to Customer
      await addDoc(collection(db, "notifications"), {
        userId: customerId,
        title: "Booking Update",
        message: `Your booking status has been updated to: ${newStatus.replace("_", " ")}`,
        link: "/dashboard",
        type: newStatus === "completed" ? "booking_completed" : "booking_update",
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

    const unsubProvider = onSnapshot(doc(db, "providers", user.uid), (docSnap) => {
      if (docSnap.exists()) setProviderData(docSnap.data());
    });

    const bookingsQ = query(
      collection(db, "bookings"),
      where("providerId", "==", user.uid)
    );

    const unsubBookings = onSnapshot(bookingsQ, (snapshot) => {
      let total = 0;
      let active = 0;
      let allBookings: any[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        allBookings.push({ id: docSnap.id, ...data });
        
        if (data.status === "completed") {
          total += Number(data.amount || 0);
        }
        if (data.status === "pending" || data.status === "accepted" || data.status === "in_progress") {
          active++;
        }
      });

      allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setEarnings(total);
      setActiveBookings(active);
      setRecentRequests(allBookings);
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
          <h1 className="text-3xl font-bold tracking-tight text-secondary-900">Welcome back, {providerData?.firstName || user?.displayName?.split(' ')[0] || "Provider"}</h1>
          <p className="text-secondary-500 mt-1">Here is what is happening with your business today.</p>
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
        <Card className="border-transparent shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Total Earnings</span>
            </div>
            <h3 className="text-3xl font-bold mt-1 text-secondary-900">{formatCurrency(earnings, currency)}</h3>
            <p className="text-sm text-secondary-500 font-medium mt-1">Lifetime completed</p>
          </CardContent>
        </Card>

        <Card className="border-transparent shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Active</span>
            </div>
            <h3 className="text-3xl font-bold mt-1 text-secondary-900">{activeBookings}</h3>
            <p className="text-sm text-secondary-500 font-medium mt-1">Bookings to fulfill</p>
          </CardContent>
        </Card>

        <Card className="border-transparent shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600">
                <Star className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Overall</span>
            </div>
            <h3 className="text-3xl font-bold mt-1 text-secondary-900">{rating}</h3>
            <p className="text-sm text-secondary-500 font-medium mt-1">Based on {providerData?.reviewCount || 0} reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="border-b border-secondary-100 pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                Booking Management
                <span className="text-xs font-medium bg-secondary-100 text-secondary-600 px-2.5 py-1 rounded-full">
                  {recentRequests.length} Total
                </span>
              </CardTitle>
              <CardDescription>Manage your service requests and active bookings.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {recentRequests.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center text-secondary-400">
                  <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-secondary-300" />
                  </div>
                  <p className="font-medium text-secondary-900">No requests yet</p>
                  <p className="text-sm mt-1">Your bookings will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-secondary-100 max-h-[600px] overflow-y-auto">
                  {recentRequests.map((req, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={req.id}
                      className="p-5 hover:bg-secondary-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-secondary-900">{req.service || "Booking Request"}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                              req.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              req.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                              req.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                              req.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {req.status.replace("_", " ")}
                            </span>
                          </div>
                          
                          <div className="text-sm text-secondary-600 mb-2">
                            <span className="font-medium text-secondary-900">Customer:</span> {req.customerName}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-secondary-500 mb-3">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(req.date + "T12:00:00").toLocaleDateString()} at {req.time}</span>
                            {req.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{req.address}</span>}
                          </div>
                          
                          {req.notes && (
                            <div className="bg-white p-3 rounded-xl border border-secondary-100 text-sm text-secondary-600 italic">
                              "{req.notes}"
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                          {/* Chat Shortcut */}
                          <Link href={`/chat?provider=${req.customerId}`}>
                            <Button size="sm" variant="outline" className="w-full sm:w-auto h-8 px-2 text-secondary-600">
                              <MessageSquare className="w-4 h-4 mr-1.5" /> Message Customer
                            </Button>
                          </Link>

                          {/* Action Buttons based on status */}
                          {req.status === "pending" ? (
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button size="sm" className="flex-1 sm:flex-none h-8 px-3 bg-green-600 hover:bg-green-700"
                                isLoading={updatingId === req.id} onClick={() => handleUpdateBooking(req.id, "accepted", req.customerId)}>
                                <CheckCircle className="w-4 h-4 mr-1.5" /> Accept
                              </Button>
                              <Button size="sm" variant="ghost" className="flex-1 sm:flex-none h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                                isLoading={updatingId === req.id} onClick={() => handleUpdateBooking(req.id, "rejected", req.customerId)}>
                                <XCircle className="w-4 h-4 mr-1.5" /> Reject
                              </Button>
                            </div>
                          ) : req.status === "accepted" ? (
                            <Button size="sm" className="w-full sm:w-auto h-8 px-3 bg-indigo-600 hover:bg-indigo-700"
                              isLoading={updatingId === req.id} onClick={() => handleUpdateBooking(req.id, "in_progress", req.customerId)}>
                              Start Service
                            </Button>
                          ) : req.status === "in_progress" ? (
                            <Button size="sm" className="w-full sm:w-auto h-8 px-3 bg-primary-600 hover:bg-primary-700"
                              isLoading={updatingId === req.id} onClick={() => {
                                const val = prompt("Enter final charge amount to complete this booking:", req.estimatedRate || providerData?.hourlyRate || "0");
                                if (val !== null && !isNaN(Number(val))) {
                                  handleUpdateBooking(req.id, "completed", req.customerId, Number(val));
                                }
                              }}>
                              Mark Complete
                            </Button>
                          ) : req.status === "completed" ? (
                            <div className="text-sm font-bold text-green-600 flex items-center gap-1 mt-2">
                              {req.paymentStatus === "paid" ? "Paid: " : "Owed: "}{formatCurrency(Number(req.amount || 0), currency)}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-secondary-100">
              <CardTitle className="text-lg">Profile Checklist</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-secondary-700">Profile Photo</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${providerData?.photoURL ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {providerData?.photoURL ? "Done" : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-secondary-700">Services & Pricing</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${providerData?.servicesOffered && providerData?.hourlyRate ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {providerData?.servicesOffered && providerData?.hourlyRate ? "Done" : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-secondary-700">Verification</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${user?.isVerified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {user?.isVerified ? "Verified" : "Required"}
                </span>
              </div>
              <div className="pt-4 mt-2 border-t border-secondary-100">
                <Link href="/provider/dashboard/profile">
                  <Button className="w-full" variant={isProfileComplete ? "outline" : "default"}>
                    {isProfileComplete ? "Edit Profile" : "Complete Profile"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* AI Banner Generator Hint */}
          <Card className="bg-gradient-to-br from-primary-600 to-indigo-700 text-white border-transparent overflow-hidden relative">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <CardContent className="p-6 relative z-10">
              <h3 className="text-lg font-bold mb-2">Want to stand out?</h3>
              <p className="text-primary-100 text-sm mb-4">Use our AI to generate a professional banner and description for your profile.</p>
              <Link href="/provider/dashboard/profile">
                <Button className="w-full bg-white text-primary-700 hover:bg-primary-50 font-semibold shadow-md">
                  Try AI Tools
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
