"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import {
  collection, query, where, onSnapshot, orderBy,
  updateDoc, deleteDoc, doc, writeBatch, limit
} from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  Bell, CheckCheck, Trash2, X, Calendar, MessageSquare,
  Star, ShieldCheck, ShieldX, CheckCircle, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  booking_new: <Calendar className="w-4 h-4 text-blue-500" />,
  booking_update: <Calendar className="w-4 h-4 text-amber-500" />,
  booking_completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  message_new: <MessageSquare className="w-4 h-4 text-indigo-500" />,
  review_received: <Star className="w-4 h-4 text-yellow-500" />,
  verification_approved: <ShieldCheck className="w-4 h-4 text-green-500" />,
  verification_rejected: <ShieldX className="w-4 h-4 text-red-500" />,
  default: <Bell className="w-4 h-4 text-secondary-400" />,
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.read) batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  };

  const markRead = (id: string) => {
    updateDoc(doc(db, "notifications", id), { read: true });
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "notifications", id));
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        id="notifications-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-secondary-100 text-secondary-600 hover:text-secondary-900 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-secondary-200 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-100 bg-gradient-to-r from-primary-50 to-indigo-50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary-600" />
                  <h3 className="font-bold text-secondary-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full font-medium">{unreadCount} new</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-secondary-100 rounded-lg text-secondary-400 hover:text-secondary-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-[400px] overflow-y-auto divide-y divide-secondary-50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-10 h-10 text-secondary-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-secondary-500">All caught up!</p>
                    <p className="text-xs text-secondary-400 mt-1">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <Link
                      key={n.id}
                      href={n.link || "#"}
                      onClick={() => { markRead(n.id); setIsOpen(false); }}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-secondary-50 transition-colors group ${!n.read ? "bg-primary-50/40" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${!n.read ? "bg-white shadow-sm" : "bg-secondary-50"}`}>
                        {NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.default}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-medium truncate ${!n.read ? "text-secondary-900" : "text-secondary-600"}`}>{n.title}</p>
                          {!n.read && <span className="w-2 h-2 bg-primary-500 rounded-full shrink-0" />}
                        </div>
                        <p className="text-xs text-secondary-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-secondary-400 mt-1">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteNotification(n.id, e)}
                        disabled={deletingId === n.id}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg text-secondary-300 hover:text-red-500 transition-all shrink-0"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-secondary-100 p-3 bg-secondary-50">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  View All Notifications →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
