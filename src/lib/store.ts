"use client";
import { create } from "zustand";
interface User { id: string; phone: string; name?: string; email?: string; avatar?: string; role: "CUSTOMER" | "PROVIDER" | "ADMIN"; provider?: any; }
interface AuthStore { user: User | null; token: string | null; isLoading: boolean; setUser: (user: User | null) => void; setToken: (token: string | null) => void; setLoading: (loading: boolean) => void; logout: () => void; }
export const useAuthStore = create<AuthStore>((set) => ({
  user: null, token: null, isLoading: true,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => { document.cookie = "auth_token=; Max-Age=0; path=/"; localStorage.removeItem("auth_token"); set({ user: null, token: null }); },
}));
interface LocationStore { latitude: number | null; longitude: number | null; address: string; setLocation: (lat: number, lng: number, address?: string) => void; }
export const useLocationStore = create<LocationStore>((set) => ({
  latitude: null, longitude: null, address: "",
  setLocation: (latitude, longitude, address = "") => set({ latitude, longitude, address }),
}));
