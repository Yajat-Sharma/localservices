"use client";
import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/ui/StarRating";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatDistance } from "@/lib/geo";
interface ProviderCardProps {
  provider: { id: string; businessName: string; description?: string; avgRating: number; totalReviews: number; priceMin: number; priceMax: number; isAvailable: boolean; images: string[]; distance?: number; user: { name?: string; avatar?: string }; category: { name: string; nameHi?: string; icon: string } };
  featured?: boolean;
}
export function ProviderCard({ provider, featured = false }: ProviderCardProps) {
  const { t, language } = useLanguage();
  const categoryName = language === "hi" && (provider.category as any).nameHi ? (provider.category as any).nameHi : provider.category.name;
  return (
    <Link href={`/provider/${provider.id}`}>
      <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer ${featured ? "border-blue-100 ring-1 ring-blue-200" : ""}`}>
        {featured && <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 text-center tracking-wide">⭐ TOP RATED</div>}
        <div className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100">
                {provider.images[0] || provider.user.avatar ? (
                  <Image src={provider.images[0] || provider.user.avatar || ""} alt={provider.businessName} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">{provider.category.icon}</div>
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${provider.isAvailable ? "bg-emerald-400" : "bg-red-400"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight truncate flex items-center gap-1">
                      {provider.businessName}
                      {(provider as any).isVerified && (
                        <span title="Verified Provider" className="text-blue-500 text-xs">✓</span>
                      )}
                    </h3>
                  <span className="text-xs text-gray-500">{categoryName}</span>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${provider.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {provider.isAvailable ? t("available") : t("unavailable")}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <StarRating value={provider.avgRating} readonly size="sm" />
                <span className="text-xs font-semibold text-amber-600">{provider.avgRating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({provider.totalReviews})</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-gray-900">₹{provider.priceMin}–₹{provider.priceMax}</span>
                {provider.distance !== undefined && <span className="text-xs text-gray-500">📍 {formatDistance(provider.distance)}</span>}
              </div>
            </div>
          </div>
          {provider.description && <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed">{provider.description}</p>}
        </div>
      </div>
    </Link>
  );
}
