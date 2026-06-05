"use client";
import { create } from "zustand";
interface ProviderInfo {
  id: string;
  businessName: string;
  categoryId: string;
  isApproved: boolean;
  isAvailable: boolean;
  avgRating: number;
  totalReviews: number;
}
interface User { id: string; phone: string; name?: string; email?: string; avatar?: string; role: "CUSTOMER" | "PROVIDER" | "ADMIN"; originalRole?: string; provider?: ProviderInfo; }
interface AuthStore { user: User | null; isLoading: boolean; setUser: (user: User | null) => void; setLoading: (loading: boolean) => void; logout: () => void; }
export const useAuthStore = create<AuthStore>((set) => ({
  user: null, isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  // Cookie is the single auth source — clear it and the middleware blocks all SSR routes.
  logout: () => { document.cookie = "auth_token=; Max-Age=0; path=/"; set({ user: null }); },
}));

interface LocationStore { latitude: number | null; longitude: number | null; address: string; setLocation: (lat: number, lng: number, address?: string) => void; }
export const useLocationStore = create<LocationStore>((set) => ({
  latitude: null, longitude: null, address: "",
  setLocation: (latitude, longitude, address = "") => set({ latitude, longitude, address }),
}));
