"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Send } from "lucide-react";

interface ChatBoxProps {
  chatId: string;
  currentUser: any;
}

export default function ChatBox({ chatId, currentUser }: ChatBoxProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsub();
  }, [chatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    const text = newMessage.trim();
    setNewMessage("");

    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || (currentUser.role === "provider" ? "Provider" : "Customer"),
        createdAt: new Date().toISOString() // Or serverTimestamp()
      });

      await updateDoc(doc(db, "chats", chatId), {
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => {
          const isMe = msg.senderId === currentUser.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div className="text-xs text-secondary-500 mb-1 px-1">
                {msg.senderName}
              </div>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                isMe ? "bg-primary-600 text-white rounded-br-sm" : "bg-secondary-100 text-secondary-900 rounded-bl-sm"
              }`}>
                {msg.text}
              </div>
              <div className="text-[10px] text-secondary-400 mt-1 px-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-secondary-200 bg-white">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-white"
          />
          <Button type="submit" disabled={!newMessage.trim()} className="shrink-0 px-4">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
