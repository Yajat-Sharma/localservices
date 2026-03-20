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
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    minRating: 0,
    maxPrice: 10000,
    availableOnly: false,
    verifiedOnly: false,
    radius: 5,
    sortBy: "distance", // distance, rating, price_low, price_high
  });

  useEffect(() => { fetchCategories(); getUserLocation(); }, []);
  useEffect(() => { if (latitude && longitude) fetchProviders(); }, [latitude, longitude, selectedCategory]);

  const getUserLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation(pos.coords.latitude, pos.coords.longitude),
      () => setLocation(19.0760, 72.8777, "Mumbai")
    );
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/categories");
      setCategories(res.data.categories);
    } catch {}
  };

  const fetchProviders = useCallback(async () => {
    if (!latitude || !longitude) return;
    setLoading(true);
    try {
      const params: any = {
        lat: latitude,
        lng: longitude,
        radius: filters.radius,
      };
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const res = await axios.get("/api/providers", { params });
      let results: any[] = res.data.providers;

      // Client-side filtering
      if (filters.availableOnly) results = results.filter(p => p.isAvailable);
      if (filters.verifiedOnly) results = results.filter(p => p.isVerified);
      if (filters.minRating > 0) results = results.filter(p => p.avgRating >= filters.minRating);
      if (filters.maxPrice < 10000) results = results.filter(p => p.priceMin <= filters.maxPrice);

      // Sorting
      results = [...results].sort((a, b) => {
        if (filters.sortBy === "rating") return b.avgRating - a.avgRating;
        if (filters.sortBy === "price_low") return a.priceMin - b.priceMin;
        if (filters.sortBy === "price_high") return b.priceMax - a.priceMax;
        return (a.distance ?? 99) - (b.distance ?? 99);
      });

      setProviders(results);
      setTopProviders(results.filter(p => p.avgRating >= 4 && p.isAvailable).slice(0, 3));
    } catch {
      toast.error("Failed to load providers");
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, selectedCategory, searchQuery, filters]);

  useEffect(() => {
    const d = setTimeout(() => { if (latitude && longitude) fetchProviders(); }, 400);
    return () => clearTimeout(d);
  }, [searchQuery, fetchProviders]);

  const activeFiltersCount = [
    filters.minRating > 0,
    filters.maxPrice < 10000,
    filters.availableOnly,
    filters.verifiedOnly,
    filters.radius !== 5,
    filters.sortBy !== "distance",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav
        showSearch
        searchValue={searchQuery}
        onSearch={setSearchQuery}
        rightElement={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(true)}
              className={`relative w-10 h-10 flex items-center justify-center rounded-2xl transition-colors ${showFilters || activeFiltersCount > 0 ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
            >
              <span className="text-lg">⚙️</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button onClick={getUserLocation} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors">
              📍
            </button>
          </div>
        }
      />

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 pt-5 pb-8">
        <h2 className="text-white font-bold text-xl">
          Hello, {user?.name?.split(" ")[0] || "there"} 👋
        </h2>
        <p className="text-blue-200 text-sm mt-0.5">What service do you need today?</p>

        {/* Active filters bar */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
            {filters.availableOnly && (
              <span className="flex-shrink-0 bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                ✓ Available
              </span>
            )}
            {filters.verifiedOnly && (
              <span className="flex-shrink-0 bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                ✓ Verified
              </span>
            )}
            {filters.minRating > 0 && (
              <span className="flex-shrink-0 bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                ⭐ {filters.minRating}+
              </span>
            )}
            {filters.maxPrice < 10000 && (
              <span className="flex-shrink-0 bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                ₹ Max {filters.maxPrice}
              </span>
            )}
            {filters.radius !== 5 && (
              <span className="flex-shrink-0 bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                📍 {filters.radius}km
              </span>
            )}
            <button
              onClick={() => setFilters({ minRating: 0, maxPrice: 10000, availableOnly: false, verifiedOnly: false, radius: 5, sortBy: "distance" })}
              className="flex-shrink-0 bg-red-400/80 text-white text-xs px-3 py-1 rounded-full"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Categories - overlapping the hero */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-3xl shadow-card p-3">
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(prev => prev === cat.slug ? null : cat.slug)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all duration-200 ${
                  selectedCategory === cat.slug
                    ? "bg-blue-500 text-white shadow-md"
                    : "hover:bg-gray-50"
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className={`text-xs font-semibold leading-tight text-center line-clamp-1 ${selectedCategory === cat.slug ? "text-white" : "text-gray-600"}`}>
                  {language === "hi" ? cat.nameHi : cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5 pb-24">
        {/* Sort bar */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-xs text-gray-500 font-medium flex-shrink-0">Sort:</span>
          {[
            { key: "distance", label: "📍 Nearest" },
            { key: "rating", label: "⭐ Top Rated" },
            { key: "price_low", label: "💰 Cheapest" },
            { key: "price_high", label: "💎 Premium" },
          ].map(sort => (
            <button
              key={sort.key}
              onClick={() => setFilters(f => ({ ...f, sortBy: sort.key }))}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filters.sortBy === sort.key
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {sort.label}
            </button>
          ))}
        </div>

        {/* Top Rated */}
        {topProviders.length > 0 && !selectedCategory && !searchQuery && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title">⭐ Top Rated</h3>
              <span className="text-xs text-blue-600 font-medium">Within {filters.radius}km</span>
            </div>
            <div className="space-y-3">
              {topProviders.map((p, i) => (
                <ProviderCard key={p.id} provider={p} featured={i === 0} />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">
              {selectedCategory
                ? categories.find(c => c.slug === selectedCategory)?.[language === "hi" ? "nameHi" : "name"]
                : searchQuery ? `Results for "${searchQuery}"` : t("nearby_providers")}
            </h3>
            {providers.length > 0 && (
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-200">
                {providers.length} found
              </span>
            )}
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
                      <div className="h-3 skeleton rounded-lg w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
              <div className="text-5xl mb-3">🔍</div>
              <p className="font-semibold text-gray-700">{t("no_providers_found")}</p>
              <p className="text-sm text-gray-500 mt-1">{t("try_different_category")}</p>
              <div className="flex gap-2 justify-center mt-4">
                {selectedCategory && (
                  <button onClick={() => setSelectedCategory(null)} className="btn-secondary text-sm px-4 py-2">
                    Clear category
                  </button>
                )}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => setFilters({ minRating: 0, maxPrice: 10000, availableOnly: false, verifiedOnly: false, radius: 5, sortBy: "distance" })}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map(p => <ProviderCard key={p.id} provider={p} />)}
            </div>
          )}
        </div>
      </div>

      {/* Filter Bottom Sheet */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowFilters(false)}>
          <div className="bottom-sheet p-6 w-full animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Filters & Sort</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-5 max-h-96 overflow-y-auto">
              {/* Radius */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Search Radius: <span className="text-blue-600">{filters.radius}km</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={filters.radius}
                  onChange={e => setFilters(f => ({ ...f, radius: Number(e.target.value) }))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1km</span>
                  <span>20km</span>
                </div>
              </div>

              {/* Min Rating */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Minimum Rating: <span className="text-blue-600">{filters.minRating > 0 ? `${filters.minRating}⭐` : "Any"}</span>
                </label>
                <div className="flex gap-2">
                  {[0, 3, 3.5, 4, 4.5].map(r => (
                    <button
                      key={r}
                      onClick={() => setFilters(f => ({ ...f, minRating: r }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${filters.minRating === r ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}
                    >
                      {r === 0 ? "Any" : `${r}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Price */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Max Price: <span className="text-blue-600">₹{filters.maxPrice >= 10000 ? "Any" : filters.maxPrice}</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={filters.maxPrice}
                  onChange={e => setFilters(f => ({ ...f, maxPrice: Number(e.target.value) }))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>₹100</span>
                  <span>Any</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-semibold text-sm">Available Now</p>
                    <p className="text-xs text-gray-500">Show only available providers</p>
                  </div>
                  <button
                    onClick={() => setFilters(f => ({ ...f, availableOnly: !f.availableOnly }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${filters.availableOnly ? "bg-blue-500" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${filters.availableOnly ? "translate-x-6" : ""}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-semibold text-sm">✓ Verified Only</p>
                    <p className="text-xs text-gray-500">Show only verified providers</p>
                  </div>
                  <button
                    onClick={() => setFilters(f => ({ ...f, verifiedOnly: !f.verifiedOnly }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${filters.verifiedOnly ? "bg-blue-500" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${filters.verifiedOnly ? "translate-x-6" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setFilters({ minRating: 0, maxPrice: 10000, availableOnly: false, verifiedOnly: false, radius: 5, sortBy: "distance" });
                }}
                className="btn-secondary flex-1"
              >
                Reset
              </button>
              <button
                onClick={() => { setShowFilters(false); fetchProviders(); }}
                className="btn-primary flex-1"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}