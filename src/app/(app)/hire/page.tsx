"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore, useLocationStore } from "@/lib/store";
import axios from "axios";
import toast from "react-hot-toast";

export default function HirePage() {
  const { t, language } = useLanguage();
  const { user } = useAuthStore();
  const { latitude, longitude, setLocation } = useLocationStore();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [topProviders, setTopProviders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchCategories(); getUserLocation(); }, []);
  useEffect(() => { if (latitude && longitude) fetchProviders(); }, [latitude, longitude, selectedCategory]);

  const getUserLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation(pos.coords.latitude, pos.coords.longitude),
      () => setLocation(19.0760, 72.8777, "Mumbai")
    );
  };

  const fetchCategories = async () => {
    try { const res = await axios.get("/api/categories"); setCategories(res.data.categories); } catch {}
  };

  const fetchProviders = useCallback(async () => {
    if (!latitude || !longitude) return;
    setLoading(true);
    try {
      const params: any = { lat: latitude, lng: longitude, radius: 5 };
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      const res = await axios.get("/api/providers", { params });
      setProviders(res.data.providers);
      setTopProviders(res.data.providers.filter((p: any) => p.avgRating >= 4).slice(0, 3));
    } catch { toast.error("Failed to load providers"); }
    finally { setLoading(false); }
  }, [latitude, longitude, selectedCategory, searchQuery]);

  useEffect(() => {
    const d = setTimeout(() => { if (latitude && longitude) fetchProviders(); }, 400);
    return () => clearTimeout(d);
  }, [searchQuery, fetchProviders]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav
        showSearch
        searchValue={searchQuery}
        onSearch={setSearchQuery}
        rightElement={
          <button onClick={getUserLocation} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors text-lg">📍</button>
        }
      />
      <div className="px-4 py-4 space-y-6 pb-24 animate-fade-in">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Hello, {user?.name?.split(" ")[0] || "there"} 👋</h2>
          <p className="text-sm text-gray-500 mt-0.5">What service do you need today?</p>
        </div>

        <div>
          <h3 className="section-title mb-3">{t("categories")}</h3>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(prev => prev === cat.slug ? null : cat.slug)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200 ${
                  selectedCategory === cat.slug
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white text-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-semibold leading-tight text-center line-clamp-1">
                  {language === "hi" ? cat.nameHi : cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {topProviders.length > 0 && !selectedCategory && !searchQuery && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title">⭐ {t("top_rated")}</h3>
              <span className="text-xs text-blue-600 font-medium">Within 5km</span>
            </div>
            <div className="space-y-3">
              {topProviders.map((p, i) => <ProviderCard key={p.id} provider={p} featured={i === 0} />)}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">
              {selectedCategory
                ? categories.find(c => c.slug === selectedCategory)?.[language === "hi" ? "nameHi" : "name"]
                : t("nearby_providers")}
            </h3>
            {providers.length > 0 && <span className="text-xs text-gray-500">{providers.length} found</span>}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="card p-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 skeleton rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 skeleton rounded-lg w-3/4" />
                      <div className="h-3 skeleton rounded-lg w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🔍</div>
              <p className="font-semibold text-gray-700">{t("no_providers_found")}</p>
              <p className="text-sm text-gray-500 mt-1">{t("try_different_category")}</p>
              {selectedCategory && (
                <button onClick={() => setSelectedCategory(null)} className="mt-4 btn-secondary text-sm px-4 py-2">
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map(p => <ProviderCard key={p.id} provider={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}