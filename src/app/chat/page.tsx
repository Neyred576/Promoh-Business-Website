"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot, getDocs, doc, setDoc, addDoc, orderBy } from "firebase/firestore";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import ChatBox from "@/components/chat/ChatBox";

function ChatPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const providerParam = searchParams.get("provider");
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    // Automatically create or fetch a conversation if providerParam is present
    if (providerParam && user.role === "customer") {
      const initChat = async () => {
        const q = query(collection(db, "chats"), where("customerId", "==", user.uid), where("providerId", "==", providerParam));
        const snap = await getDocs(q);
        if (snap.empty) {
          const newChatRef = doc(collection(db, "chats"));
          await setDoc(newChatRef, {
            customerId: user.uid,
            customerName: user.displayName,
            providerId: providerParam,
            updatedAt: new Date().toISOString()
          });
          setActiveChatId(newChatRef.id);
        } else {
          setActiveChatId(snap.docs[0].id);
        }
      };
      initChat();
    }
  }, [user, providerParam]);

  useEffect(() => {
    if (!user) return;

    const roleField = user.role === "provider" ? "providerId" : "customerId";
    const q = query(collection(db, "chats"), where(roleField, "==", user.uid));
    
    const unsub = onSnapshot(q, async (snap) => {
      const chatsList: any[] = [];
      for (const d of snap.docs) {
        const data = d.data();
        let otherName = "User";
        
        // Fetch the other person's name if we don't have it locally
        if (user.role === "provider") {
          otherName = data.customerName || "Customer";
        } else {
          // It's a customer, need provider name
          if (data.providerName) {
            otherName = data.providerName;
          } else {
            // Lazy fetch provider name
            otherName = "Provider";
          }
        }

        chatsList.push({ id: d.id, otherName, ...data });
      }
      chatsList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setConversations(chatsList);
      
      if (!activeChatId && chatsList.length > 0 && !providerParam) {
        setActiveChatId(chatsList[0].id);
      }
    });

    return () => unsub();
  }, [user, activeChatId, providerParam]);

  if (loading || !user) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 flex gap-6 h-[calc(100vh-64px)]">
        
        {/* Conversations List */}
        <Card className="w-1/3 flex flex-col overflow-hidden hidden md:flex">
          <div className="p-4 border-b border-secondary-200 bg-white">
            <h2 className="font-bold text-lg">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-secondary-400 text-sm">No messages yet.</div>
            ) : (
              conversations.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${
                    activeChatId === chat.id ? "bg-primary-50 border border-primary-200" : "hover:bg-white border border-transparent"
                  }`}
                >
                  <div className="font-semibold text-secondary-900 truncate">{chat.otherName}</div>
                  <div className="text-xs text-secondary-500 mt-1 truncate">{new Date(chat.updatedAt).toLocaleString()}</div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {activeChatId ? (
            <ChatBox chatId={activeChatId} currentUser={user} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-secondary-400">
              Select a conversation to start messaging.
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <ChatPageContent />
    </Suspense>
  );
}
