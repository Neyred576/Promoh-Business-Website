"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import {
  collection, query, where, onSnapshot, orderBy,
  updateDoc, deleteDoc, doc, writeBatch
} from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import {
  Bell, CheckCheck, Trash2, Calendar, MessageSquare,
  Star, ShieldCheck, ShieldX, CheckCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  booking_new: <Calendar className="w-5 h-5 text-blue-500" />,
  booking_update: <Calendar className="w-5 h-5 text-amber-500" />,
  booking_completed: <CheckCircle className="w-5 h-5 text-green-500" />,
  message_new: <MessageSquare className="w-5 h-5 text-indigo-500" />,
  review_received: <Star className="w-5 h-5 text-yellow-500" />,
  verification_approved: <ShieldCheck className="w-5 h-5 text-green-500" />,
  verification_rejected: <ShieldX className="w-5 h-5 text-red-500" />,
  default: <Bell className="w-5 h-5 text-secondary-400" />,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  booking_new: "bg-blue-50 border-blue-100",
  booking_update: "bg-amber-50 border-amber-100",
  booking_completed: "bg-green-50 border-green-100",
  message_new: "bg-indigo-50 border-indigo-100",
  review_received: "bg-yellow-50 border-yellow-100",
  verification_approved: "bg-green-50 border-green-100",
  verification_rejected: "bg-red-50 border-red-100",
  default: "bg-secondary-50 border-secondary-100",
};

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setFetching(false);
    });
    return () => unsub();
  }, [user?.uid]);

  const markAllRead = async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.read) batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  };

  const deleteAll = async () => {
    if (!confirm("Delete all notifications? This cannot be undone.")) return;
    const batch = writeBatch(db);
    notifications.forEach(n => batch.delete(doc(db, "notifications", n.id)));
    await batch.commit();
  };

  const displayed = filter === "unread" ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary-600" /> Notification Center
            </h1>
            <p className="text-secondary-500 text-sm mt-1">{unreadCount} unread · {notifications.length} total</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <CheckCheck className="w-4 h-4 mr-1.5" /> Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={deleteAll}>
                <Trash2 className="w-4 h-4 mr-1.5" /> Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-secondary-200 mb-6">
          {(["all", "unread"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${filter === f ? "border-primary-600 text-primary-700" : "border-transparent text-secondary-500 hover:text-secondary-800"}`}
            >
              {f === "all" ? "All" : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {fetching ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-secondary-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-secondary-200 rounded-2xl bg-white">
            <Bell className="w-14 h-14 text-secondary-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-secondary-500">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="text-secondary-400 mt-2 text-sm">Activity updates will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {displayed.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={n.link || "#"}
                    onClick={() => { if (!n.read) updateDoc(doc(db, "notifications", n.id), { read: true }); }}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-md ${!n.read ? NOTIFICATION_COLORS[n.type] || NOTIFICATION_COLORS.default : "bg-white border-secondary-100"}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.read ? "bg-white shadow-sm" : "bg-secondary-50"}`}>
                      {NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.default}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-semibold text-sm ${!n.read ? "text-secondary-900" : "text-secondary-600"}`}>{n.title}</p>
                        {!n.read && <span className="w-2.5 h-2.5 bg-primary-500 rounded-full shrink-0" />}
                      </div>
                      <p className="text-sm text-secondary-600 mt-0.5">{n.message}</p>
                      <p className="text-xs text-secondary-400 mt-1.5">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteDoc(doc(db, "notifications", n.id)); }}
                      className="p-1.5 hover:bg-red-50 rounded-xl text-secondary-300 hover:text-red-500 transition-colors shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
