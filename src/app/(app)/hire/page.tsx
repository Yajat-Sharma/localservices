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
  const [isListening, setIsListening] = useState(false);

  const [filters, setFilters] = useState({
    minRating: 0,
    maxPrice: 10000,
    availableOnly: false,
    verifiedOnly: false,
    radius: 5,
    sortBy: "distance",
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
      const params: any = { lat: latitude, lng: longitude, radius: filters.radius };
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const res = await axios.get("/api/providers", { params });
      let results: any[] = res.data.providers;

      if (filters.availableOnly) results = results.filter(p => p.isAvailable);
      if (filters.verifiedOnly) results = results.filter(p => p.isVerified);
      if (filters.minRating > 0) results = results.filter(p => p.avgRating >= filters.minRating);
      if (filters.maxPrice < 10000) results = results.filter(p => p.priceMin <= filters.maxPrice);

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

  const startVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Voice search not supported on this browser");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang =
      language === "hi" ? "hi-IN" :
      language === "mr" ? "mr-IN" :
      language === "gu" ? "gu-IN" :
      language === "ta" ? "ta-IN" :
      language === "te" ? "te-IN" :
      language === "bn" ? "bn-IN" : "en-IN";

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    toast("🎤 Listening... speak now!", { duration: 3000, icon: "🎙️" });

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      toast.success(`🎤 "${transcript}"`);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone.");
      } else {
        toast.error("Could not hear you. Try again!");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

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
        <div className="flex items-center gap-1">
          {/* Voice Search Button */}
          <button
            onClick={startVoiceSearch}
            className={`relative w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-200 ${
              isListening
                ? "bg-red-500 text-white shadow-lg scale-110"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            title="Voice Search"
          >
            {isListening ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
            {isListening && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-300 rounded-full animate-ping" />
            )}
          </button>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(true)}
            className={`relative w-10 h-10 flex items-center justify-center rounded-2xl transition-colors ${
              showFilters || activeFiltersCount > 0 ? "bg-blue-500 text-white" : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Location Button */}
          <button
            onClick={getUserLocation}
            className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors text-gray-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z"/>
            </svg>
          </button>
        </div>
      }
      />

      {/* Voice Search Indicator */}
      {isListening && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="font-medium text-sm">Listening...</span>
          <div className="flex items-end gap-0.5 h-4">
            <span className="w-0.5 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-0.5 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-0.5 h-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            <span className="w-0.5 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: "450ms" }} />
            <span className="w-0.5 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "600ms" }} />
          </div>
        </div>
      )}

      {/* Hero Banner */}
<div className="relative px-4 pt-6 pb-10 overflow-hidden"
  style={{ background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #be185d 100%)" }}>
  {/* Pattern */}
  <div className="absolute inset-0 opacity-10"
    style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
  {/* Blobs */}
  <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-20 blur-3xl"
    style={{ background: "white" }} />
  <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-15 blur-2xl"
    style={{ background: "#f472b6" }} />

  <div className="relative">
    <p className="text-purple-200 text-sm font-medium mb-1">Hello 👋</p>
    <h2 className="text-white font-black text-2xl leading-tight tracking-tight mb-4">
      {user?.name?.split(" ")[0] || "there"},<br />
      <span className="text-purple-200">what do you need today?</span>
    </h2>

    {/* Active filters */}
    {activeFiltersCount > 0 && (
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mt-3">
        {filters.availableOnly && (
          <span className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: "rgba(255,255,255,0.2)" }}>Available</span>
        )}
        {filters.verifiedOnly && (
          <span className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: "rgba(255,255,255,0.2)" }}>Verified</span>
        )}
        {filters.minRating > 0 && (
          <span className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: "rgba(255,255,255,0.2)" }}>⭐ {filters.minRating}+</span>
        )}
        {filters.maxPrice < 10000 && (
          <span className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: "rgba(255,255,255,0.2)" }}>₹{filters.maxPrice} max</span>
        )}
        <button
          onClick={() => setFilters({ minRating: 0, maxPrice: 10000, availableOnly: false, verifiedOnly: false, radius: 5, sortBy: "distance" })}
          className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold text-white"
          style={{ background: "rgba(239,68,68,0.5)" }}>
          Clear all
        </button>
      </div>
    )}
  </div>
</div>

{/* Categories card — overlapping hero */}
<div className="px-4 -mt-5 relative z-10">
  <div className="rounded-3xl p-3 overflow-x-auto"
    style={{ background: "var(--bg-card)", boxShadow: "0 8px 32px rgba(124,58,237,0.12)", border: "1px solid var(--border)" }}>
    <div className="grid grid-cols-4 gap-2 min-w-0">
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => setSelectedCategory(prev => prev === cat.slug ? null : cat.slug)}
          className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all duration-200 active:scale-95"
          style={selectedCategory === cat.slug ? {
            background: "linear-gradient(135deg, #7c3aed, #ec4899)",
            boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
          } : {
            background: "transparent",
          }}
        >
          <span className="text-2xl">{cat.icon}</span>
          <span className="text-xs font-bold leading-tight text-center line-clamp-1"
            style={{ color: selectedCategory === cat.slug ? "white" : "var(--text-secondary)" }}>
            {language === "hi" ? cat.nameHi : cat.name}
          </span>
        </button>
      ))}
    </div>
  </div>
</div>

      {/* Categories */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-3xl shadow-card p-3">
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(prev => prev === cat.slug ? null : cat.slug)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all duration-200 ${
                  selectedCategory === cat.slug ? "bg-blue-500 text-white shadow-md" : "hover:bg-gray-50"
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
                filters.sortBy === sort.key ? "bg-blue-500 text-white" : "bg-white text-gray-600 border border-gray-200"
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
              {topProviders.map((p, i) => <ProviderCard key={p.id} provider={p} featured={i === 0} />)}
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
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Search Radius: <span className="text-blue-600">{filters.radius}km</span>
                </label>
                <input type="range" min="1" max="20" value={filters.radius}
                  onChange={e => setFilters(f => ({ ...f, radius: Number(e.target.value) }))}
                  className="w-full accent-blue-500" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1km</span><span>20km</span></div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Minimum Rating: <span className="text-blue-600">{filters.minRating > 0 ? `${filters.minRating}⭐` : "Any"}</span>
                </label>
                <div className="flex gap-2">
                  {[0, 3, 3.5, 4, 4.5].map(r => (
                    <button key={r} onClick={() => setFilters(f => ({ ...f, minRating: r }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${filters.minRating === r ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                      {r === 0 ? "Any" : `${r}+`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Max Price: <span className="text-blue-600">₹{filters.maxPrice >= 10000 ? "Any" : filters.maxPrice}</span>
                </label>
                <input type="range" min="100" max="10000" step="100" value={filters.maxPrice}
                  onChange={e => setFilters(f => ({ ...f, maxPrice: Number(e.target.value) }))}
                  className="w-full accent-blue-500" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>₹100</span><span>Any</span></div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                  <div><p className="font-semibold text-sm">Available Now</p><p className="text-xs text-gray-500">Show only available providers</p></div>
                  <button onClick={() => setFilters(f => ({ ...f, availableOnly: !f.availableOnly }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${filters.availableOnly ? "bg-blue-500" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${filters.availableOnly ? "translate-x-6" : ""}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                  <div><p className="font-semibold text-sm">✓ Verified Only</p><p className="text-xs text-gray-500">Show only verified providers</p></div>
                  <button onClick={() => setFilters(f => ({ ...f, verifiedOnly: !f.verifiedOnly }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${filters.verifiedOnly ? "bg-blue-500" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${filters.verifiedOnly ? "translate-x-6" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setFilters({ minRating: 0, maxPrice: 10000, availableOnly: false, verifiedOnly: false, radius: 5, sortBy: "distance" })}
                className="btn-secondary flex-1">Reset</button>
              <button onClick={() => { setShowFilters(false); fetchProviders(); }}
                className="btn-primary flex-1">Apply Filters</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}