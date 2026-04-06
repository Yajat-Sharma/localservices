"use client";
import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/ui/StarRating";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatDistance } from "@/lib/geo";

interface ProviderCardProps {
  provider: {
    id: string;
    businessName: string;
    description?: string;
    avgRating: number;
    totalReviews: number;
    priceMin: number;
    priceMax: number;
    isAvailable: boolean;
    isVerified?: boolean;
    images: string[];
    distance?: number;
    user: { name?: string; avatar?: string };
    category: { name: string; nameHi?: string; icon: string };
  };
  featured?: boolean;
}

export function ProviderCard({ provider, featured = false }: ProviderCardProps) {
  const { language } = useLanguage();
  const categoryName = language === "hi" && (provider.category as any).nameHi
    ? (provider.category as any).nameHi
    : provider.category.name;

  return (
    <Link href={`/provider/${provider.id}`}>
      <div className={`card cursor-pointer group transition-all duration-300 ${featured ? "ring-2 ring-purple-300 dark:ring-purple-700" : ""}`}
        style={featured ? { boxShadow: "0 8px 32px rgba(124,58,237,0.2)" } : {}}>

        {/* Featured banner */}
        {featured && (
          <div className="py-2 px-4 text-center text-xs font-black tracking-widest text-white"
            style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)" }}>
            ⭐ TOP RATED NEAR YOU
          </div>
        )}

        <div className="p-4">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-16 h-16 rounded-2xl overflow-hidden`}
                style={featured ? { boxShadow: "0 4px 16px rgba(124,58,237,0.3)" } : {}}>
                {provider.images[0] || provider.user.avatar ? (
                  <Image src={provider.images[0] || provider.user.avatar || ""} alt={provider.businessName}
                    width={64} height={64} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl"
                    style={{ background: featured ? "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.08))" : "var(--bg-subtle)" }}>
                    {provider.category.icon}
                  </div>
                )}
              </div>
              {/* Online dot */}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 transition-transform group-hover:scale-110 ${provider.isAvailable ? "bg-green-500" : "bg-gray-400"}`}
                style={{ borderColor: "var(--bg-card)" }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-black text-sm leading-tight truncate" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                      {provider.businessName}
                    </h3>
                    {provider.isVerified && (
                      <span className="verified-badge flex-shrink-0">✓</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--text-muted)" }}>
                    {categoryName}
                  </p>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  provider.isAvailable
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${provider.isAvailable ? "bg-green-500" : "bg-gray-400"}`} />
                  {provider.isAvailable ? "Open" : "Busy"}
                </span>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1.5 mt-2">
                <StarRating value={provider.avgRating} readonly size="sm" />
                <span className="text-xs font-black" style={{ color: "#f59e0b" }}>
                  {provider.avgRating.toFixed(1)}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  ({provider.totalReviews})
                </span>
              </div>

              {/* Price + Distance */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>from</span>
                  <span className="text-sm font-black gradient-text">₹{provider.priceMin}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>– ₹{provider.priceMax}</span>
                </div>
                {provider.distance !== undefined && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(124,58,237,0.06)", color: "var(--primary)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z"/>
                    </svg>
                    {formatDistance(provider.distance)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {provider.description && (
            <p className="text-xs mt-3 line-clamp-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {provider.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}