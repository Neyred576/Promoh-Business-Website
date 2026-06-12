"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { db } from "@/lib/firebase/client";
import { collection, query, onSnapshot, doc, getDoc, updateDoc, deleteDoc, setDoc, addDoc } from "firebase/firestore";
import {
  Users, Briefcase, Clock, Activity, CheckCircle, XCircle,
  Star, Trash2, Eye, ToggleLeft, ToggleRight, ShieldCheck, AlertTriangle, Plus, LayoutDashboard, Key, Calendar, Flag, ShieldAlert, Ban
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currencies";

interface Provider {
  id: string;
  businessName: string;
  firstName: string;
  lastName: string;
  email: string;
  servicesOffered: string;
  location: string;
  status: string;
  isVerified: boolean;
  isFeatured: boolean;
  banned?: boolean;
  verificationDocumentUrl?: string;
  createdAt: string;
  rating?: number;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  banned?: boolean;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Real-time stats
  const [stats, setStats] = useState({ customers: 0, providers: 0, pending: 0 });
  const [pendingProviders, setPendingProviders] = useState<Provider[]>([]);
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [platformSettings, setPlatformSettings] = useState({
    popularCategories: [] as string[],
    emergencyServices: [] as {name: string, slug: string}[],
    exploreCategories: [] as {name: string, slug: string}[],
    announcement: { message: "", isActive: false }
  });
  const [newPopular, setNewPopular] = useState("");
  const [newEmergency, setNewEmergency] = useState({ name: "", slug: "" });
  const [newExplore, setNewExplore] = useState({ name: "", slug: "" });
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [announcementActive, setAnnouncementActive] = useState(false);

  // Real-time listeners for stats
  useEffect(() => {
    // Listen to all users
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      let customersCount = 0;
      const customersList: Customer[] = [];
      snap.docs.forEach(d => { 
        if (d.data().role === "customer") {
          customersCount++;
          customersList.push({ id: d.id, ...d.data() } as Customer);
        }
      });
      setStats(prev => ({ ...prev, customers: customersCount }));
      setAllCustomers(customersList);
      setLoadingCustomers(false);
    });

    // Listen to providers
    const unsubProviders = onSnapshot(collection(db, "providers"), (snap) => {
      const providers = snap.docs.map(d => ({ id: d.id, ...d.data() } as Provider));
      const pending = providers.filter(p => p.status === "Pending");
      setStats(prev => ({ ...prev, providers: providers.length, pending: pending.length }));
      setPendingProviders(pending);
      setAllProviders(providers);
      setLoadingProviders(false);
    });

    // Listen to all bookings
    const unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
      const bookings: any[] = [];
      let revenue = 0;
      snap.docs.forEach(d => {
        const data = d.data();
        bookings.push({ id: d.id, ...data });
        if (data.status === "completed") {
          revenue += Number(data.amount || 0);
        }
      });
      bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllBookings(bookings);
      setTotalRevenue(revenue);
    });

    // Listen to all reports
    const unsubReports = onSnapshot(collection(db, "reports"), (snap) => {
      const reports = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllReports(reports);
    });

    return () => { unsubUsers(); unsubProviders(); unsubBookings(); unsubReports(); };
  }, []);

  useEffect(() => {
    // Listen for real-time platform settings changes
    const unsubSettings = onSnapshot(doc(db, "platform_settings", "homepage"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlatformSettings(prev => ({
          ...prev,
          popularCategories: data.popularCategories || [],
          emergencyServices: data.emergencyServices || [],
          exploreCategories: data.exploreCategories || [
            { name: "Electricians", slug: "Electricians" },
            { name: "Plumbers", slug: "Plumbers" },
            { name: "Cleaners", slug: "Cleaners" },
            { name: "Tutors", slug: "Tutors" },
            { name: "Photographers", slug: "Photographers" },
            { name: "Mechanics", slug: "Mechanics" },
            { name: "Carpenters", slug: "Carpenters" },
            { name: "Painters", slug: "Painters" },
            { name: "Movers", slug: "Movers" },
            { name: "Beauty Pros", slug: "Beauty" },
            { name: "IT Specialists", slug: "IT" },
            { name: "Home Repair", slug: "HomeRepair" },
          ],
        }));
      }
    });

    const unsubAnnouncements = onSnapshot(doc(db, "platform_settings", "announcements"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlatformSettings(prev => ({
          ...prev,
          announcement: { message: data.message || "", isActive: data.isActive || false }
        }));
        setAnnouncementMsg(data.message || "");
        setAnnouncementActive(data.isActive || false);
      }
    });

    return () => { unsubSettings(); unsubAnnouncements(); };
  }, []);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(""), 3000); };

  const approveProvider = async (id: string) => {
    setActionLoading(id + "_approve");
    try {
      await updateDoc(doc(db, "providers", id), { status: "Approved", isVerified: true });
      await updateDoc(doc(db, "users", id), { isVerified: true });
      
      await addDoc(collection(db, "notifications"), {
        userId: id,
        title: "Account Approved!",
        message: "Your provider account has been verified and approved. You are now live on the platform.",
        link: "/provider/dashboard",
        read: false,
        createdAt: new Date().toISOString()
      });

      showMsg("✅ Provider approved and verified!");
    } catch (e) { showMsg("Error approving provider."); }
    finally { setActionLoading(null); }
  };

  const rejectProvider = async (id: string) => {
    setActionLoading(id + "_reject");
    try {
      await updateDoc(doc(db, "providers", id), { status: "Rejected", isVerified: false });
      
      await addDoc(collection(db, "notifications"), {
        userId: id,
        title: "Account Update",
        message: "Your provider account application was rejected. Please contact support for details.",
        link: "/provider/dashboard",
        read: false,
        createdAt: new Date().toISOString()
      });

      showMsg("Provider rejected.");
    } catch (e) { showMsg("Error rejecting provider."); }
    finally { setActionLoading(null); }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    setActionLoading(id + "_feature");
    try {
      await updateDoc(doc(db, "providers", id), { isFeatured: !current });
      showMsg(current ? "Removed from homepage." : "⭐ Featured on homepage!");
    } catch (e) { showMsg("Error updating featured status."); }
    finally { setActionLoading(null); }
  };

  const deleteUser = async (id: string, collection_name: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, collection_name, id));
      if (collection_name === "providers") {
        await deleteDoc(doc(db, "users", id));
      }
      showMsg("Account deleted.");
    } catch (e) { showMsg("Error deleting account."); }
  };

  const toggleBanUser = async (id: string, collection_name: string, isBanned: boolean) => {
    try {
      const newBannedState = !isBanned;
      await updateDoc(doc(db, collection_name, id), { banned: newBannedState });
      if (collection_name === "providers") {
        await updateDoc(doc(db, "users", id), { banned: newBannedState });
      }
      showMsg(newBannedState ? "User has been banned." : "User has been unbanned.");
    } catch (e) { showMsg("Error updating ban status."); }
  };

  const resolveReport = async (reportId: string, action: "dismiss" | "ban", targetId: string, targetType: string) => {
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: "resolved",
        resolution: action,
        resolvedAt: new Date().toISOString()
      });
      if (action === "ban") {
        await toggleBanUser(targetId, targetType === "provider" ? "providers" : "users", false);
      }
      showMsg(`Report resolved (${action})`);
    } catch (err) {
      showMsg("Error resolving report.");
    }
  };

  const viewCredentials = async (id: string, name: string) => {
    try {
      const docSnap = await getDoc(doc(db, "support_credentials", id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        alert(`Support Credentials for ${name}:\n\nEmail: ${data.email}\nPhone: ${data.phone || 'N/A'}\nPassword Hint: ${data.passwordHint}\nLength: ${data.passwordLength} chars`);
      } else {
        alert("No support credentials found for this provider (they likely registered before this feature was added).");
      }
    } catch (e) {
      alert("Error fetching credentials.");
    }
  };

  const updateSettings = async (updates: any) => {
    try {
      await updateDoc(doc(db, "platform_settings", "homepage"), updates);
      showMsg("Settings updated successfully.");
    } catch (e) {
      await setDoc(doc(db, "platform_settings", "homepage"), updates);
      showMsg("Settings created successfully.");
    }
  };

  const addPopularCat = () => {
    if (!newPopular) return;
    updateSettings({ popularCategories: [...platformSettings.popularCategories, newPopular] });
    setNewPopular("");
  };
  const removePopularCat = (cat: string) => {
    updateSettings({ popularCategories: platformSettings.popularCategories.filter(c => c !== cat) });
  };

  const addEmergencyService = () => {
    if (!newEmergency.name || !newEmergency.slug) return;
    updateSettings({ emergencyServices: [...platformSettings.emergencyServices, newEmergency] });
    setNewEmergency({ name: "", slug: "" });
  };
  const removeEmergencyService = (name: string) => {
    updateSettings({ emergencyServices: platformSettings.emergencyServices.filter(s => s.name !== name) });
  };

  const addExploreCategory = () => {
    if (!newExplore.name || !newExplore.slug) return;
    updateSettings({ exploreCategories: [...platformSettings.exploreCategories, newExplore] });
    setNewExplore({ name: "", slug: "" });
  };
  const removeExploreCategory = (name: string) => {
    updateSettings({ exploreCategories: platformSettings.exploreCategories.filter(s => s.name !== name) });
  };
  const moveExploreCategory = (index: number, direction: -1 | 1) => {
    const newCategories = [...platformSettings.exploreCategories];
    if (index + direction < 0 || index + direction >= newCategories.length) return;
    
    const temp = newCategories[index];
    newCategories[index] = newCategories[index + direction];
    newCategories[index + direction] = temp;
    
    updateSettings({ exploreCategories: newCategories });
  };

  const updateAnnouncement = async () => {
    try {
      await setDoc(doc(db, "platform_settings", "announcements"), {
        message: announcementMsg,
        isActive: announcementActive,
        id: Date.now().toString()
      });
      showMsg("Global announcement updated.");
    } catch (e) {
      showMsg("Error updating announcement.");
    }
  };

  const statCards = [
    { title: "Total Customers", value: stats.customers, icon: <Users className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50 border-blue-200" },
    { title: "Total Providers", value: stats.providers, icon: <Briefcase className="w-5 h-5 text-indigo-600" />, bg: "bg-indigo-50 border-indigo-200" },
    { title: "Pending Verifications", value: stats.pending, icon: <Clock className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50 border-amber-200" },
    { title: "Approved Providers", value: allProviders.filter(p => p.status === "Approved").length, icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: "bg-green-50 border-green-200" },
  ];

  const TABS = ["overview", "analytics", "bookings", "providers", "customers", "reports", "categories", "homepage CMS"];

  const openReportsCount = allReports.filter(r => r.status === "open").length;

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-secondary-900">Admin Control Center</h1>
        <p className="text-secondary-500 mt-1">Real-time platform management and oversight.</p>
      </div>

      {/* Flash Message */}
      {message && (
        <div className="mb-4 p-3 bg-primary-50 border border-primary-200 text-primary-800 rounded-xl text-sm font-medium animate-in fade-in">
          {message}
        </div>
      )}

      {/* Alerts Row */}
      <div className="flex flex-col gap-3 mb-6">
        {stats.pending > 0 && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-amber-800 font-medium">
              {stats.pending} provider application{stats.pending > 1 ? "s" : ""} pending review
            </span>
            <Button size="sm" variant="outline" className="ml-auto border-amber-300 text-amber-800 hover:bg-amber-100"
              onClick={() => setActiveTab("providers")}>
              Review Now
            </Button>
          </div>
        )}
        {openReportsCount > 0 && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-red-800 font-medium">
              {openReportsCount} unresolved Trust & Safety report{openReportsCount > 1 ? "s" : ""}
            </span>
            <Button size="sm" variant="outline" className="ml-auto border-red-300 text-red-800 hover:bg-red-100"
              onClick={() => setActiveTab("reports")}>
              Review Reports
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-secondary-200 mb-6 overflow-x-auto hide-scrollbar">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === tab ? "border-indigo-600 text-indigo-700" : "border-transparent text-secondary-500 hover:text-secondary-800"
            }`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "reports" && openReportsCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{openReportsCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <Card key={i} className={`border ${s.bg}`}>
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-white shadow-sm`}>
                    {s.icon}
                  </div>
                  <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">{s.title}</p>
                  <h3 className="text-3xl font-bold mt-1 text-secondary-900">{s.value}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pending Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> Pending Provider Approvals
              </CardTitle>
              <CardDescription>Review and approve or reject new provider applications.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingProviders.length === 0 ? (
                <div className="text-center py-8 text-secondary-400 border-2 border-dashed border-secondary-200 rounded-xl">
                  No pending applications right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingProviders.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-secondary-200 bg-white flex-wrap gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-secondary-900 truncate">
                          {p.businessName || `${p.firstName} ${p.lastName}`}
                        </div>
                        <div className="text-xs text-secondary-500">{p.servicesOffered} · {p.location} · {p.email}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.verificationDocumentUrl && (
                          <Link href={p.verificationDocumentUrl} target="_blank">
                            <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50" title="View Identity Document">
                              <ShieldCheck className="w-4 h-4 mr-1" /> View ID
                            </Button>
                          </Link>
                        )}
                        <Link href={`/provider/${p.id}`} target="_blank">
                          <Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button>
                        </Link>
                        <Button size="sm" variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-50"
                          isLoading={actionLoading === p.id + "_approve"}
                          onClick={() => approveProvider(p.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          isLoading={actionLoading === p.id + "_reject"}
                          onClick={() => rejectProvider(p.id)}>
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> Live Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {[
                  ...allProviders.map(p => ({ type: "provider", data: p as any, time: new Date(p.createdAt).getTime() })),
                  ...allCustomers.map(c => ({ type: "customer", data: c as any, time: new Date(c.createdAt).getTime() })),
                  ...allBookings.map(b => ({ type: "booking", data: b as any, time: new Date(b.createdAt).getTime() }))
                ]
                .sort((a, b) => b.time - a.time)
                .slice(0, 10)
                .map((act, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm p-3 rounded-xl bg-white border border-secondary-100">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      act.type === 'provider' ? 'bg-indigo-100 text-indigo-600' :
                      act.type === 'customer' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {act.type === 'provider' ? <Briefcase className="w-4 h-4" /> :
                       act.type === 'customer' ? <Users className="w-4 h-4" /> :
                       <Calendar className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">
                        {act.type === 'provider' ? 'New Provider Registered' :
                         act.type === 'customer' ? 'New Customer Joined' :
                         'New Booking Created'}
                      </p>
                      <p className="text-secondary-500 mt-0.5">
                        {act.type === 'provider' ? `${act.data.businessName || act.data.firstName} joined.` :
                         act.type === 'customer' ? `${act.data.firstName} ${act.data.lastName} joined.` :
                         `${act.data.customerName} booked a service.`}
                      </p>
                      <p className="text-xs text-secondary-400 mt-1">{new Date(act.time).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Revenue</CardTitle>
              <CardDescription>Total transaction volume processed across all completed bookings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{formatCurrency(totalRevenue, "USD")}</div>
              <p className="text-sm text-secondary-500 mt-2">from {allBookings.filter(b => b.status === "completed").length} completed bookings.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
                  <div className="text-2xl font-bold text-amber-700">{allBookings.filter(b => b.status === "pending").length}</div>
                  <div className="text-sm text-amber-600 font-medium">Pending</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
                  <div className="text-2xl font-bold text-blue-700">{allBookings.filter(b => b.status === "accepted").length}</div>
                  <div className="text-sm text-blue-600 font-medium">Accepted</div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center">
                  <div className="text-2xl font-bold text-green-700">{allBookings.filter(b => b.status === "completed").length}</div>
                  <div className="text-sm text-green-600 font-medium">Completed</div>
                </div>
                <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center">
                  <div className="text-2xl font-bold text-red-700">{allBookings.filter(b => b.status === "cancelled" || b.status === "rejected").length}</div>
                  <div className="text-sm text-red-600 font-medium">Cancelled/Rejected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BOOKINGS */}
      {activeTab === "bookings" && (
        <Card>
          <CardHeader>
            <CardTitle>All Platform Bookings ({allBookings.length})</CardTitle>
            <CardDescription>Live feed of all service requests across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            {allBookings.length === 0 ? (
              <div className="text-center py-12 text-secondary-400">No bookings yet.</div>
            ) : (
              <div className="space-y-3">
                {allBookings.map(b => (
                  <div key={b.id} className="flex items-center gap-4 p-4 rounded-xl border border-secondary-200 bg-white hover:bg-white transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-secondary-900 flex gap-2 items-center">
                        Booking from <span className="font-bold">{b.customerName}</span> to <span className="font-bold">{b.providerName}</span>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'completed' ? 'bg-green-100 text-green-700' :
                          b.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          b.status === 'accepted' || b.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>{b.status.replace("_", " ")}</span>
                      </div>
                      <div className="text-xs text-secondary-500 mt-1">
                        Date: {b.date} at {b.time} · Service: {b.service}
                      </div>
                      {b.amount && <div className="text-sm font-bold text-green-600 mt-1">Amount: {formatCurrency(b.amount, b.currency || "USD")}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* REPORTS */}
      {activeTab === "reports" && (
        <Card>
          <CardHeader>
            <CardTitle>Trust & Safety Reports ({allReports.length})</CardTitle>
            <CardDescription>Review and resolve user reports. Banning a user prevents them from logging in.</CardDescription>
          </CardHeader>
          <CardContent>
            {allReports.length === 0 ? (
              <div className="text-center py-12 text-secondary-400">No reports found.</div>
            ) : (
              <div className="space-y-4">
                {allReports.map(r => (
                  <div key={r.id} className={`p-4 rounded-xl border ${r.status === "open" ? "bg-red-50 border-red-100" : "bg-white border-secondary-200"}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Flag className={`w-5 h-5 ${r.status === "open" ? "text-red-500" : "text-secondary-400"}`} />
                        <span className="font-bold text-secondary-900">Report against {r.targetName} ({r.targetType})</span>
                        {r.status !== "open" && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold uppercase">Resolved: {r.resolution}</span>
                        )}
                      </div>
                      <span className="text-xs text-secondary-500">{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="ml-7 space-y-2">
                      <p className="text-sm text-secondary-700"><span className="font-semibold">Reason:</span> {r.reason}</p>
                      {r.description && <p className="text-sm text-secondary-600 italic">"{r.description}"</p>}
                      <p className="text-xs text-secondary-400">Reported by: {r.reporterName}</p>
                      
                      {r.status === "open" && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-red-100">
                          <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => resolveReport(r.id, "ban", r.targetId, r.targetType)}>
                            <Ban className="w-4 h-4 mr-1.5" /> Ban User
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => resolveReport(r.id, "dismiss", r.targetId, r.targetType)}>
                            Dismiss Report
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PROVIDERS */}
      {activeTab === "providers" && (
        <Card>
          <CardHeader>
            <CardTitle>All Providers ({allProviders.length})</CardTitle>
            <CardDescription>Manage approvals, bans, and homepage feature status for all providers.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProviders ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-secondary-100 rounded-xl animate-pulse" />)}</div>
            ) : allProviders.length === 0 ? (
              <div className="text-center py-12 text-secondary-400">No providers registered yet.</div>
            ) : (
              <div className="space-y-3">
                {allProviders.map(p => (
                  <div key={p.id} className={`flex items-center gap-4 p-4 rounded-xl border hover:bg-white transition-colors flex-wrap ${p.banned ? "border-red-300 bg-red-50" : "border-secondary-200"}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-indigo-400 flex items-center justify-center text-white font-bold shrink-0">
                      {(p.businessName || p.firstName || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-secondary-900 flex items-center gap-2 flex-wrap">
                        {p.businessName || `${p.firstName} ${p.lastName}`}
                        {p.isVerified && <ShieldCheck className="w-4 h-4 text-primary-500" />}
                        {p.isFeatured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                        {p.banned && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Banned</span>}
                      </div>
                      <div className="text-xs text-secondary-400">{p.email} · {p.servicesOffered}</div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      p.status === "Approved" ? "bg-green-100 text-green-700" :
                      p.status === "Rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{p.status}</span>
                    
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                      {p.verificationDocumentUrl && (
                        <Link href={p.verificationDocumentUrl} target="_blank">
                          <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50" title="View Identity Document">
                            <ShieldCheck className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      {p.status === "Approved" && !p.banned && (
                        <Button size="sm" variant="ghost" title={p.isFeatured ? "Remove from homepage" : "Feature on homepage"}
                          isLoading={actionLoading === p.id + "_feature"}
                          onClick={() => toggleFeatured(p.id, p.isFeatured)}
                          className={p.isFeatured ? "text-yellow-600 hover:text-yellow-700" : "text-secondary-400 hover:text-yellow-500"}>
                          {p.isFeatured ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </Button>
                      )}
                      {p.status === "Pending" && !p.banned && (
                        <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50"
                          isLoading={actionLoading === p.id + "_approve"}
                          onClick={() => approveProvider(p.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        title="View Support Credentials"
                        onClick={() => viewCredentials(p.id, p.businessName || `${p.firstName} ${p.lastName}`)}>
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className={`${p.banned ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-red-500 hover:text-red-700 hover:bg-red-50"}`}
                        title={p.banned ? "Unban User" : "Ban User"}
                        onClick={() => toggleBanUser(p.id, "providers", !!p.banned)}>
                        {p.banned ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete User"
                        onClick={() => deleteUser(p.id, "providers")}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CUSTOMERS */}
      {activeTab === "customers" && (
        <Card>
          <CardHeader>
            <CardTitle>All Customers ({allCustomers.length})</CardTitle>
            <CardDescription>View and manage registered customer accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCustomers ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-secondary-100 rounded-xl animate-pulse" />)}</div>
            ) : allCustomers.length === 0 ? (
              <div className="text-center py-12 text-secondary-400">No customers yet.</div>
            ) : (
              <div className="space-y-2">
                {allCustomers.map(c => (
                  <div key={c.id} className={`flex items-center gap-4 p-4 rounded-xl border hover:bg-white transition-colors ${c.banned ? "border-red-300 bg-red-50" : "border-secondary-200"}`}>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {(c.firstName || c.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-secondary-900 flex items-center gap-2">
                        {c.firstName} {c.lastName}
                        {c.banned && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Banned</span>}
                      </div>
                      <div className="text-xs text-secondary-400">{c.email} {c.phone && `· ${c.phone}`}</div>
                    </div>
                    <div className="text-xs text-secondary-400 hidden sm:block">{new Date(c.createdAt).toLocaleDateString()}</div>
                    
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className={`${c.banned ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-red-500 hover:text-red-700 hover:bg-red-50"}`}
                        title={c.banned ? "Unban User" : "Ban User"}
                        onClick={() => toggleBanUser(c.id, "users", !!c.banned)}>
                        {c.banned ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete User"
                        onClick={() => deleteUser(c.id, "users")}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CATEGORIES */}
      {activeTab === "categories" && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Categories</CardTitle>
            <CardDescription>Service categories shown on the homepage and search filters.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {["Electricians","Plumbers","Cleaners","Tutors","Photographers","Mechanics","Carpenters","Painters","Movers","Beauty Professionals","IT Specialists","Home Repair"].map(cat => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-xl border border-secondary-200 bg-white">
                  <span className="font-medium text-sm text-secondary-800">{cat}</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* HOMEPAGE CMS */}
      {activeTab === "homepage CMS" && (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-600" />
            Changes made here will instantly reflect on the live website. Ensure spellings match the category names.
          </div>

          {/* Global Announcement */}
          <Card className="border-primary-200">
            <CardHeader className="bg-primary-50 rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-primary-900">
                <AlertTriangle className="w-5 h-5 text-primary-600" /> Global Announcement
              </CardTitle>
              <CardDescription className="text-primary-700">Display a banner across the entire platform.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Announcement Message</label>
                <Input 
                  placeholder="e.g., Welcome to Promoh! Enjoy 10% off your first booking." 
                  value={announcementMsg} 
                  onChange={e => setAnnouncementMsg(e.target.value)} 
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="active-toggle"
                    checked={announcementActive} 
                    onChange={e => setAnnouncementActive(e.target.checked)} 
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="active-toggle" className="text-sm font-medium text-secondary-700">Banner Active</label>
                </div>
                <Button onClick={updateAnnouncement}>Save Announcement</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Categories</CardTitle>
                <CardDescription>Shown below the main search bar on the homepage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. Electricians" 
                    value={newPopular} 
                    onChange={e => setNewPopular(e.target.value)} 
                    onKeyDown={e => e.key === "Enter" && addPopularCat()}
                  />
                  <Button onClick={addPopularCat}><Plus className="w-4 h-4 mr-1" /> Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {platformSettings.popularCategories.length === 0 && (
                    <span className="text-secondary-400 text-sm italic">Empty. Add categories above.</span>
                  )}
                  {platformSettings.popularCategories.map(cat => (
                    <div key={cat} className="flex items-center gap-2 px-3 py-1.5 bg-secondary-100 rounded-full text-sm font-medium">
                      {cat}
                      <button onClick={() => removePopularCat(cat)} className="text-secondary-400 hover:text-red-500">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Services</CardTitle>
                <CardDescription>Shown as red emergency links on the homepage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Display Name (e.g. 24/7 Plumber)" 
                    value={newEmergency.name} 
                    onChange={e => setNewEmergency({ ...newEmergency, name: e.target.value })} 
                  />
                  <Input 
                    placeholder="Search Slug (e.g. Plumbers)" 
                    value={newEmergency.slug} 
                    onChange={e => setNewEmergency({ ...newEmergency, slug: e.target.value })} 
                  />
                  <Button onClick={addEmergencyService}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="space-y-2">
                  {platformSettings.emergencyServices.length === 0 && (
                    <span className="text-secondary-400 text-sm italic">Empty. Add services above.</span>
                  )}
                  {platformSettings.emergencyServices.map(svc => (
                    <div key={svc.name} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
                      <div>
                        <div className="font-semibold text-red-800 text-sm">{svc.name}</div>
                        <div className="text-xs text-red-600 font-mono">Links to: /search?q={svc.slug}</div>
                      </div>
                      <button onClick={() => removeEmergencyService(svc.name)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Explore Categories Grid</CardTitle>
                <CardDescription>Main service categories shown on the homepage grid. You can reorder, add, or remove them.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2 max-w-xl">
                  <Input 
                    placeholder="Display Name (e.g. Electricians)" 
                    value={newExplore.name} 
                    onChange={e => setNewExplore({ ...newExplore, name: e.target.value })} 
                  />
                  <Input 
                    placeholder="Search Slug (e.g. Electricians)" 
                    value={newExplore.slug} 
                    onChange={e => setNewExplore({ ...newExplore, slug: e.target.value })} 
                  />
                  <Button onClick={addExploreCategory}><Plus className="w-4 h-4 mr-1" /> Add Category</Button>
                </div>
                <div className="space-y-2">
                  {platformSettings.exploreCategories.length === 0 && (
                    <span className="text-secondary-400 text-sm italic">Empty. Add categories above.</span>
                  )}
                  {platformSettings.exploreCategories.map((cat, index) => (
                    <div key={`${cat.name}-${index}`} className="flex items-center justify-between p-3 bg-white border border-secondary-200 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-secondary-200 flex items-center justify-center text-sm font-bold text-secondary-600">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-secondary-800 text-sm">{cat.name}</div>
                          <div className="text-xs text-secondary-500 font-mono">/search?q={cat.slug}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => moveExploreCategory(index, -1)}
                          disabled={index === 0}
                          className="h-8 px-2"
                        >
                          ↑
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => moveExploreCategory(index, 1)}
                          disabled={index === platformSettings.exploreCategories.length - 1}
                          className="h-8 px-2"
                        >
                          ↓
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => removeExploreCategory(cat.name)}
                          className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
