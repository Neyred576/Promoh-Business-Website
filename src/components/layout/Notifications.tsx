"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 10)); // Top 10
    });

    return () => unsub();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    notifications.forEach(n => {
      if (!n.read) {
        updateDoc(doc(db, "notifications", n.id), { read: true });
      }
    });
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" className="relative p-2" onClick={() => setIsOpen(!isOpen)}>
        <Bell className="w-5 h-5 text-secondary-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-secondary-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-secondary-100 bg-white">
              <h3 className="font-bold text-secondary-900">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-secondary-500">No new notifications.</div>
              ) : (
                notifications.map(n => (
                  <Link 
                    key={n.id} 
                    href={n.link || "#"} 
                    onClick={() => {
                      if (!n.read) updateDoc(doc(db, "notifications", n.id), { read: true });
                      setIsOpen(false);
                    }}
                    className={`block p-4 border-b border-secondary-50 hover:bg-white transition-colors ${
                      !n.read ? "bg-primary-50/50" : ""
                    }`}
                  >
                    <p className="text-sm font-medium text-secondary-900">{n.title}</p>
                    <p className="text-xs text-secondary-600 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-secondary-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
