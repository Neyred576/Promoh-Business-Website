"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase/client";
import {
  collection, addDoc, query, where, orderBy, onSnapshot,
  doc, updateDoc, setDoc, serverTimestamp, getDoc, getDocs, limit
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/lib/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import {
  Send, Paperclip, Image as ImageIcon, MessageSquare, Search,
  Check, CheckCheck, Circle, ArrowLeft, X, Download, ShieldCheck
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  senderId: string;
  text?: string;
  fileUrl?: string;
  fileType?: "image" | "file";
  fileName?: string;
  readBy: string[];
  createdAt: any;
}

interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: number;
  otherUser?: {
    id: string;
    name: string;
    photo?: string;
    role?: string;
    isVerified?: boolean;
  };
}

function getChatId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}

function formatTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ChatContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetProviderId = searchParams.get("provider");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeOtherUser, setActiveOtherUser] = useState<Conversation["otherUser"] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showConvList, setShowConvList] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Auto-start chat with a provider
  useEffect(() => {
    if (targetProviderId && user?.uid) {
      const chatId = getChatId(user.uid, targetProviderId);
      openChat(chatId, targetProviderId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetProviderId, user?.uid]);

  // Load conversations
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "chats"),
      where("participantIds", "array-contains", user.uid),
      orderBy("lastMessageAt", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const convs: Conversation[] = [];
      for (const docSnap of snap.docs) {
        const data = docSnap.data() as any;
        const otherId = data.participantIds.find((id: string) => id !== user.uid);
        if (!otherId) continue;

        // Fetch other user info
        let otherUser: Conversation["otherUser"] = { id: otherId, name: "Unknown" };
        const providerSnap = await getDoc(doc(db, "providers", otherId));
        if (providerSnap.exists()) {
          const pd = providerSnap.data();
          otherUser = {
            id: otherId,
            name: pd.businessName || `${pd.firstName} ${pd.lastName}`,
            photo: pd.photoURL,
            role: "provider",
            isVerified: pd.isVerified,
          };
        } else {
          const userSnap = await getDoc(doc(db, "users", otherId));
          if (userSnap.exists()) {
            const ud = userSnap.data();
            otherUser = { id: otherId, name: `${ud.firstName} ${ud.lastName}`, photo: ud.photoURL, role: "customer" };
          }
        }

        convs.push({ id: docSnap.id, ...data, otherUser });
      }
      setConversations(convs);
    });

    return () => unsub();
  }, [user?.uid]);

  const openChat = async (chatId: string, otherId: string) => {
    setActiveChatId(chatId);
    setShowConvList(false);

    // Fetch other user info
    const providerSnap = await getDoc(doc(db, "providers", otherId));
    if (providerSnap.exists()) {
      const pd = providerSnap.data();
      setActiveOtherUser({
        id: otherId,
        name: pd.businessName || `${pd.firstName} ${pd.lastName}`,
        photo: pd.photoURL,
        role: "provider",
        isVerified: pd.isVerified,
      });
    } else {
      const userSnap = await getDoc(doc(db, "users", otherId));
      if (userSnap.exists()) {
        const ud = userSnap.data();
        setActiveOtherUser({ id: otherId, name: `${ud.firstName} ${ud.lastName}`, role: "customer" });
      }
    }

    // Ensure chat document exists
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists() && user?.uid) {
      await setDoc(chatRef, {
        participantIds: [user.uid, otherId].sort(),
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        lastMessage: "",
      });
    }
  };

  // Listen to messages in active chat
  useEffect(() => {
    if (!activeChatId || !user?.uid) return;

    const q = query(
      collection(db, "chats", activeChatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs: Message[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
      // Mark messages as read
      msgs.forEach(msg => {
        if (!msg.readBy?.includes(user.uid)) {
          updateDoc(doc(db, "chats", activeChatId, "messages", msg.id), {
            readBy: [...(msg.readBy || []), user.uid]
          }).catch(() => {});
        }
      });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });

    // Listen to typing indicator
    const typingUnsub = onSnapshot(doc(db, "chats", activeChatId), (snap) => {
      if (snap.exists()) {
        const typingUsers: Record<string, boolean> = snap.data().typing || {};
        const otherId = activeOtherUser?.id;
        if (otherId) setOtherTyping(!!typingUsers[otherId]);
      }
    });

    return () => { unsub(); typingUnsub(); };
  }, [activeChatId, user?.uid, activeOtherUser?.id]);

  const handleTyping = (val: string) => {
    setText(val);
    if (!activeChatId || !user?.uid) return;
    if (!typing) {
      setTyping(true);
      updateDoc(doc(db, "chats", activeChatId), { [`typing.${user.uid}`]: true }).catch(() => {});
    }
    if (typingTimeout.current !== undefined) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(() => {
      setTyping(false);
      updateDoc(doc(db, "chats", activeChatId), { [`typing.${user.uid}`]: false }).catch(() => {});
    }, 2000);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() && !sending) return;
    if (!activeChatId || !user?.uid || !activeOtherUser) return;
    const msgText = text.trim();
    setText("");
    setSending(true);
    try {
      // Stop typing indicator
      await updateDoc(doc(db, "chats", activeChatId), { [`typing.${user.uid}`]: false }).catch(() => {});
      setTyping(false);

      // Add message
      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        senderId: user.uid,
        text: msgText,
        readBy: [user.uid],
        createdAt: serverTimestamp(),
      });

      // Update chat last message
      await updateDoc(doc(db, "chats", activeChatId), {
        lastMessage: msgText,
        lastMessageAt: serverTimestamp(),
      });

      // Send notification to other user
      await addDoc(collection(db, "notifications"), {
        userId: activeOtherUser.id,
        title: "💬 New Message",
        message: `${user.displayName || "Someone"}: ${msgText.slice(0, 60)}${msgText.length > 60 ? "..." : ""}`,
        link: "/chat",
        type: "message_new",
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId || !user?.uid || !activeOtherUser) return;
    setUploadingFile(true);
    try {
      const storageRef = ref(storage, `chat/${activeChatId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const isImage = file.type.startsWith("image/");

      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        senderId: user.uid,
        fileUrl: url,
        fileType: isImage ? "image" : "file",
        fileName: file.name,
        readBy: [user.uid],
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "chats", activeChatId), {
        lastMessage: isImage ? "📷 Image" : `📎 ${file.name}`,
        lastMessageAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-secondary-50">
      <Navbar />

      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto px-0 md:px-4 py-0 md:py-4">
        <div className="flex flex-1 bg-white rounded-none md:rounded-2xl border border-secondary-200 overflow-hidden shadow-sm" style={{ height: "calc(100vh - 100px)" }}>

          {/* Conversation List */}
          <div className={`${showConvList ? "flex" : "hidden md:flex"} w-full md:w-80 border-r border-secondary-100 flex-col`}>
            <div className="p-4 border-b border-secondary-100">
              <h2 className="font-bold text-lg text-secondary-900">Messages</h2>
              <p className="text-xs text-secondary-500 mt-0.5">{conversations.length} conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-secondary-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-secondary-200" />
                  <p className="font-medium text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Book a service to start chatting</p>
                </div>
              ) : (
                conversations.map(conv => {
                  const isActive = activeChatId === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        openChat(conv.id, conv.otherUser?.id || "");
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-secondary-50 transition-colors text-left ${isActive ? "bg-primary-50" : "hover:bg-secondary-50"}`}
                    >
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-indigo-400 flex items-center justify-center text-white font-bold text-base shrink-0 relative overflow-hidden">
                        {conv.otherUser?.photo ? (
                          <Image src={conv.otherUser.photo} alt={conv.otherUser.name} fill className="object-cover" />
                        ) : (
                          (conv.otherUser?.name || "?")[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold text-sm truncate ${isActive ? "text-primary-700" : "text-secondary-900"}`}>
                            {conv.otherUser?.name}
                          </p>
                          <span className="text-[10px] text-secondary-400 shrink-0 ml-1">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-xs text-secondary-500 truncate mt-0.5">{conv.lastMessage || "No messages yet"}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className={`${!showConvList ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
            {!activeChatId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-secondary-400 p-8">
                <MessageSquare className="w-20 h-20 text-secondary-100 mb-4" />
                <h3 className="text-lg font-bold text-secondary-600">Select a conversation</h3>
                <p className="text-sm mt-1">Choose a chat from the left or book a service to start messaging.</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-secondary-100 flex items-center gap-3 bg-white">
                  <button onClick={() => setShowConvList(true)} className="md:hidden p-1 hover:bg-secondary-100 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-indigo-400 flex items-center justify-center text-white font-bold relative overflow-hidden">
                    {activeOtherUser?.photo ? (
                      <Image src={activeOtherUser.photo} alt={activeOtherUser.name || ""} fill className="object-cover" />
                    ) : (
                      (activeOtherUser?.name || "?")[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-secondary-900 text-sm">{activeOtherUser?.name}</p>
                      {activeOtherUser?.isVerified && (
                        <ShieldCheck className="w-4 h-4 text-primary-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-secondary-400 capitalize">{activeOtherUser?.role}</p>
                  </div>
                  {activeOtherUser && (
                    <a href={`/provider/${activeOtherUser.id}`} target="_blank" className="text-xs text-primary-600 hover:underline hidden md:block">
                      View Profile →
                    </a>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2" id="messages-container">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => {
                      const isMe = msg.senderId === user.uid;
                      const showTime = i === 0 || (messages[i - 1] && msg.createdAt && messages[i - 1].createdAt &&
                        (msg.createdAt?.toDate?.()?.getTime() - messages[i - 1].createdAt?.toDate?.()?.getTime()) > 300000);

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                            {showTime && (
                              <p className="text-[10px] text-secondary-400 text-center w-full my-2">{formatTime(msg.createdAt)}</p>
                            )}
                            {msg.fileType === "image" && msg.fileUrl ? (
                              <div className={`rounded-2xl overflow-hidden ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}>
                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <Image src={msg.fileUrl} alt="Shared image" width={240} height={160} className="object-cover hover:opacity-95 transition-opacity" />
                                </a>
                              </div>
                            ) : msg.fileType === "file" && msg.fileUrl ? (
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium ${isMe ? "bg-primary-600 text-white rounded-br-sm" : "bg-secondary-100 text-secondary-800 rounded-bl-sm"}`}
                              >
                                <Download className="w-4 h-4 shrink-0" />
                                <span className="truncate max-w-[160px]">{msg.fileName || "File"}</span>
                              </a>
                            ) : (
                              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-primary-600 text-white rounded-br-sm" : "bg-secondary-100 text-secondary-800 rounded-bl-sm"}`}>
                                {msg.text}
                              </div>
                            )}
                            {/* Read receipt */}
                            <div className={`flex items-center gap-1 ${isMe ? "justify-end" : "justify-start"}`}>
                              <span className="text-[10px] text-secondary-400">{formatTime(msg.createdAt)}</span>
                              {isMe && (
                                msg.readBy?.length > 1
                                  ? <CheckCheck className="w-3 h-3 text-primary-500" />
                                  : <Check className="w-3 h-3 text-secondary-300" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  {otherTyping && (
                    <div className="flex justify-start">
                      <div className="bg-secondary-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 bg-secondary-400 rounded-full"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-3 border-t border-secondary-100 flex items-end gap-2 bg-white">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="p-2.5 rounded-xl hover:bg-secondary-100 text-secondary-400 hover:text-secondary-700 transition-colors shrink-0"
                    title="Share a file"
                  >
                    {uploadingFile ? (
                      <div className="w-5 h-5 border-2 border-secondary-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5" />
                    )}
                  </button>
                  <textarea
                    id="chat-message-input"
                    value={text}
                    onChange={e => handleTyping(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 resize-none bg-secondary-50 border border-secondary-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 min-h-[44px] max-h-32"
                    style={{ fieldSizing: "content" } as any}
                  />
                  <button
                    id="send-message-btn"
                    type="submit"
                    disabled={!text.trim() || sending}
                    className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
