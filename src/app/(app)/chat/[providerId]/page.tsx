"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { useAuthStore } from "@/lib/store";
import axios from "axios";
import toast from "react-hot-toast";

export default function ChatPage() {
  const { providerId } = useParams<{ providerId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [providerName, setProviderName] = useState("Provider");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>();

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    initChat();
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initChat = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const pRes = await axios.get(`/api/providers/${providerId}`);
      setProviderName(pRes.data.provider.businessName);
      const bRes = await axios.get("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const booking = bRes.data.bookings.find(
        (b: any) => b.providerId === providerId || b.provider?.id === providerId
      );
      if (booking) {
        setBookingId(booking.id);
        loadMessages(booking.id, token!);
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => loadMessages(booking.id, token!), 5000);
      }
    } catch {
      toast.error("Failed to load chat");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (bid: string, token: string) => {
    try {
      const res = await axios.get(`/api/bookings/${bid}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.messages);
    } catch {}
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
      loadMessages(bookingId, token!);
    } catch {
      toast.error("Failed to send");
      setNewMsg(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNav showBack onBack={() => router.back()} title={providerName} />
      {!bookingId && !loading ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-5xl mb-3">💬</div>
            <p className="font-semibold text-gray-700">No active booking found</p>
            <p className="text-sm text-gray-500 mt-1">Book a service to start chatting</p>
            <button onClick={() => router.back()} className="mt-4 btn-primary px-6">Go Back</button>
          </div>
        </div>
      ) : (
        <>
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
              <div className="text-center pt-12 text-sm text-gray-400">No messages yet. Say hello!</div>
            ) : (
              messages.map((msg: any) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs rounded-2xl px-4 py-2.5 ${isMe ? "bg-blue-500 text-white rounded-br-sm" : "bg-white text-gray-900 rounded-bl-sm shadow-sm"}`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3">
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
                className="w-11 h-11 bg-blue-500 text-white rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "→"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}