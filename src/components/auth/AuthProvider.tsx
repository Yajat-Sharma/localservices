"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import axios from "axios";
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setToken, setLoading } = useAuthStore();
  useEffect(() => {
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    if (token) {
      setToken(token);
      axios.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setUser(res.data.user))
        .catch(() => { 
          localStorage.removeItem("auth_token"); 
          sessionStorage.removeItem("auth_token");
          document.cookie = "auth_token=; Max-Age=0; path=/";
          setUser(null); 
          setToken(null); 
        })
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, [setUser, setToken, setLoading]);
  return <>{children}</>;
}
