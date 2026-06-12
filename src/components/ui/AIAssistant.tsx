"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const QUICK_QUESTIONS = [
  "How do I book a service?",
  "Are providers verified?",
  "How does payment work?",
  "What services are available?",
];

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "👋 Hi! I'm the Promoh AI Assistant. How can I help you find the perfect professional today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "assistant", data: { message: text } }),
      });
      const { result } = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: result }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I'm having trouble right now. Please try again or browse our categories." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setOpen(true)}
              className="w-14 h-14 bg-gradient-to-br from-primary-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
              id="ai-assistant-btn"
            >
              <Bot className="w-7 h-7" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chat window */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-0 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-secondary-200 overflow-hidden flex flex-col"
              style={{ height: "480px" }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">Promoh Assistant</p>
                  <p className="text-primary-200 text-xs">Powered by AI</p>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary-50">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-full flex items-center justify-center mr-2 shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${msg.role === "user" ? "bg-primary-600 text-white rounded-br-sm" : "bg-white text-secondary-800 rounded-bl-sm shadow-sm border border-secondary-100"}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-full flex items-center justify-center mr-2 shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white rounded-xl rounded-bl-sm px-4 py-3 border border-secondary-100 shadow-sm">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 bg-secondary-400 rounded-full"
                            animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick questions */}
              {messages.length === 1 && (
                <div className="px-4 pt-2 pb-1 flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.map(q => (
                    <button key={q} onClick={() => sendMessage(q)}
                      className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium hover:bg-primary-100 transition-colors border border-primary-100">
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-secondary-100 flex gap-2 bg-white">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage(input)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-secondary-50 border border-secondary-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
