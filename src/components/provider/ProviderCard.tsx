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
      <div className={`bg-white rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
        featured
          ? "shadow-lg border-2 border-blue-200 ring-1 ring-blue-100"
          : "shadow-sm border border-gray-100 hover:shadow-md"
      }`}>
        {featured && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-4 py-1.5 text-center tracking-wider">
            ⭐ TOP RATED IN YOUR AREA
          </div>
        )}
        <div className="p-4">
          <div className="flex gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-16 h-16 rounded-2xl overflow-hidden ${featured ? "ring-2 ring-blue-200" : ""}`}>
                {provider.images[0] || provider.user.avatar ? (
                  <Image
                    src={provider.images[0] || provider.user.avatar || ""}
                    alt={provider.businessName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-2xl ${featured ? "bg-blue-50" : "bg-gray-50"}`}>
                    {provider.category.icon}
                  </div>
                )}
              </div>
              {/* Online indicator */}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                provider.isAvailable ? "bg-emerald-400" : "bg-gray-300"
              }`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
                      {provider.businessName}
                    </h3>
                    {provider.isVerified && (
                      <span className="flex-shrink-0 bg-blue-100 text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{categoryName}</span>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  provider.isAvailable
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {provider.isAvailable ? "● Available" : "○ Busy"}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mt-1.5">
                <StarRating value={provider.avgRating} readonly size="sm" />
                <span className="text-xs font-bold text-amber-600">{provider.avgRating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({provider.totalReviews})</span>
              </div>

              {/* Price & Distance */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">from</span>
                  <span className="text-sm font-bold text-gray-900">₹{provider.priceMin}</span>
                  <span className="text-xs text-gray-400">– ₹{provider.priceMax}</span>
                </div>
                {provider.distance !== undefined && (
                  <span className="text-xs text-gray-500 flex items-center gap-0.5 bg-gray-50 px-2 py-0.5 rounded-full">
                    📍 {formatDistance(provider.distance)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description preview */}
          {provider.description && (
            <p className="text-xs text-gray-500 mt-3 line-clamp-1 leading-relaxed pl-0.5">
              {provider.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}