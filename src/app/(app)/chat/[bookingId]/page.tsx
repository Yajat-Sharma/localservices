"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { useAuthStore } from "@/lib/store";
import axios from "axios";
import toast from "react-hot-toast";

export default function ChatPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace("/login"); return; }
    initChat();
    return () => clearInterval(pollRef.current);
  }, [bookingId, user, isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initChat = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const bRes = await axios.get("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const found = bRes.data.bookings.find((b: any) => b.id === bookingId);
      setBooking(found || null);
      if (found) {
        loadMessages(token!);
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => loadMessages(token!), 5000);
      }
    } catch {
      toast.error("Failed to load chat");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (token: string) => {
    try {
      const res = await axios.get(`/api/bookings/${bookingId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.messages);
    } catch { }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !bookingId) return;
    setSending(true);
    const token = localStorage.getItem("auth_token");
    const msg = newMsg.trim();
    setNewMsg("");
    try {
      await axios.post(`/api/bookings/${bookingId}/messages`, { content: msg }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadMessages(token!);
    } catch {
      toast.error("Failed to send");
      setNewMsg(msg);
    } finally {
      setSending(false);
    }
  };

  const isProvider = user?.role === "PROVIDER";
  const chatName = isProvider
    ? (booking?.customer?.name || "Customer")
    : (booking?.provider?.businessName || "Provider");

  const chatSubtitle = booking
    ? `Booking · ${new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
    : "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <TopNav showBack onBack={() => router.back()} title={chatName} subtitle={chatSubtitle} />

      {!booking && !loading ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-5xl mb-3">💬</div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Booking not found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This chat session doesn't exist or you don't have access</p>
            <button onClick={() => router.back()} className="mt-4 btn-primary px-6">Go Back</button>
          </div>
        </div>
      ) : (
        <>
          {/* Booking context banner */}
          {booking && (
            <div className="px-4 py-2 text-xs font-semibold text-center"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(236,72,153,0.04))", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
              {booking.provider?.category?.icon} {booking.problem?.slice(0, 60)}{(booking.problem?.length > 60) ? "…" : ""}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
            {loading ? (
              <div className="space-y-4 pt-4 animate-pulse">
                <div className="flex justify-start">
                  <div className="w-48 h-12 bg-gray-200 dark:bg-slate-800 rounded-2xl rounded-bl-sm" />
                </div>
                <div className="flex justify-end">
                  <div className="w-32 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-2xl rounded-br-sm" />
                </div>
                <div className="flex justify-start">
                  <div className="w-40 h-16 bg-gray-200 dark:bg-slate-800 rounded-2xl rounded-bl-sm" />
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center pt-12 text-sm text-gray-400 dark:text-gray-500">No messages yet. Say hello! 👋</div>
            ) : (
              messages.map((msg: any) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs rounded-2xl px-4 py-2.5 ${isMe
                        ? "rounded-br-sm text-white"
                        : "rounded-bl-sm shadow-sm bg-white dark:bg-slate-800"
                      }`}
                      style={isMe ? { background: "linear-gradient(135deg, #7c3aed, #ec4899)" } : {}}>
                      <p className={`text-sm leading-relaxed ${isMe ? "text-white" : "text-gray-900 dark:text-white"}`}>
                        {msg.content}
                      </p>
                      <p className={`text-xs mt-1 ${isMe ? "text-purple-200" : "text-gray-400 dark:text-gray-500"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-3 border-t"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 input-field py-2.5 text-sm"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !newMsg.trim()}
                className="w-11 h-11 text-white rounded-2xl flex items-center justify-center transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
              >
                {sending
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                }
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
