"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import axios from "axios";
import toast from "react-hot-toast";

export function PushNotificationToggle() {
  const { user } = useAuthStore();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {}
  };

  const subscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      });

      const token = localStorage.getItem("auth_token");
      await axios.post("/api/push", { subscription: sub.toJSON() }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsSubscribed(true);
      toast.success("Push notifications enabled!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      const token = localStorage.getItem("auth_token");
      await axios.delete("/api/push", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsSubscribed(false);
      toast.success("Push notifications disabled");
    } catch {
      toast.error("Failed to disable notifications");
    } finally {
      setLoading(false);
    }
  };

  if (!supported) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-2xl">
      <div>
        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
          Push Notifications
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {isSubscribed ? "You'll receive booking alerts" : "Get notified about bookings"}
        </p>
      </div>
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={loading}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          isSubscribed ? "bg-blue-500" : "bg-gray-300 dark:bg-slate-600"
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          isSubscribed ? "translate-x-6" : ""
        }`} />
      </button>
    </div>
  );
}