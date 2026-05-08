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
    whatsapp?: string;
    totalBookings?: number;
    address?: string;
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

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!provider.whatsapp) return;
    const text = encodeURIComponent(`Hi ${provider.businessName}, I found your profile on LocalServices and would like to inquire about your services.`);
    window.open(`https://wa.me/${provider.whatsapp}?text=${text}`, "_blank");
  };

  const locality = provider.address ? provider.address.split(",")[0].trim() : "";
  const isNearby = provider.distance !== undefined && provider.distance < 2;

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

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            {(provider.totalBookings || 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                <span>🏆</span> {provider.totalBookings} Jobs Done
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
              <span>⚡</span> Fast Responder
            </span>
            {isNearby && locality && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <span>🏘️</span> {locality}
              </span>
            )}
          </div>

          {/* Description */}
          {provider.description && (
            <p className="text-xs mt-3 line-clamp-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {provider.description}
            </p>
          )}

          {/* WhatsApp Button */}
          {provider.whatsapp && (
            <div className="mt-4">
              <button 
                onClick={handleWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 active:scale-95"
                style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", color: "white", boxShadow: "0 4px 12px rgba(37, 211, 102, 0.2)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                Chat on WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}