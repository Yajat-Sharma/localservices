"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import axios from "axios";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  useEffect(() => {
    // The browser sends the auth_token cookie automatically.
    // No localStorage read needed — the middleware validates it server-side.
    axios.get("/api/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        // Invalid/expired cookie — clear it and treat as logged out
        document.cookie = "auth_token=; Max-Age=0; path=/";
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [setUser, setLoading]);
  return <>{children}</>;
}
