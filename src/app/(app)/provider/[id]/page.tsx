export const dynamic = "force-dynamic";
export const generateStaticParams = () => [];"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { TopNav } from "@/components/shared/TopNav";
import { StarRating } from "@/components/ui/StarRating";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore, useLocationStore } from "@/lib/store";
import { formatDistance } from "@/lib/geo";
import axios from "axios";
import toast from "react-hot-toast";

export default function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuthStore();
  const { latitude, longitude } = useLocationStore();
  const [provider, setProvider] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [problem, setProblem] = useState("");
  const [address, setAddress] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => { fetchProvider(); }, [id]);

  const fetchProvider = async () => {
    try {
      const params: any = {};
      if (latitude && longitude) { params.lat = latitude; params.lng = longitude; }
      const res = await axios.get(`/api/providers/${id}`, { params });
      setProvider(res.data.provider);
      setReviews(res.data.reviews || []);
    } catch {
      toast.error("Provider not found");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!problem.trim()) { toast.error("Please describe your problem"); return; }
    if (!user) { router.push("/login"); return; }
    setBookingLoading(true);
    const token = localStorage.getItem("auth_token");
    try {
      await axios.post("/api/bookings", {
        providerId: id, problem, address, latitude, longitude
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(t("booking_pending"));
      setBookingModalOpen(false);
      router.push("/bookings");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!myRating) { toast.error("Please select a rating"); return; }
    const token = localStorage.getItem("auth_token");
    try {
      await axios.post(`/api/providers/${id}/review`, {
        rating: myRating, comment: myComment
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Review submitted!");
      setShowRatingModal(false);
      fetchProvider();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white">
      <TopNav showBack onBack={() => router.back()} title="Loading..." />
      <div className="p-4 space-y-4">
        <div className="h-48 skeleton rounded-3xl" />
        <div className="h-6 skeleton rounded-lg w-3/4" />
        <div className="h-4 skeleton rounded-lg w-1/2" />
      </div>
    </div>
  );

  if (!provider) return null;

  return (
    <div className="min-h-screen bg-white">
      <TopNav showBack onBack={() => router.back()} title={provider.businessName} />
      <div className="pb-32">
        {/* Image */}
        <div className="relative bg-gray-100 h-56 overflow-hidden">
          {provider.images?.[0] ? (
            <Image src={provider.images[0]} alt={provider.businessName} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">
              {provider.category.icon}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-4 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-xl font-bold text-gray-900">{provider.businessName}</h1>
                {provider.isVerified && (
                  <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {language === "hi" ? provider.category.nameHi : provider.category.name}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${provider.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {provider.isAvailable ? "🟢 " + t("available") : "🔴 " + t("unavailable")}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <StarRating value={provider.avgRating} readonly size="sm" />
              <span className="text-sm font-bold text-amber-600">{provider.avgRating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({provider.totalReviews})</span>
            </div>
            {provider.distance !== undefined && (
              <span className="text-xs text-gray-500">📍 {formatDistance(provider.distance)} away</span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 p-3 bg-gray-50 rounded-2xl">
            <div>
              <p className="text-xs text-gray-500">{t("price_range")}</p>
              <p className="text-lg font-bold text-gray-900">₹{provider.priceMin} – ₹{provider.priceMax}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{t("service_area")}</p>
              <p className="text-sm font-semibold text-gray-700">{provider.serviceRadius}km radius</p>
            </div>
          </div>
        </div>

        {/* About */}
        {provider.description && (
          <div className="px-4 mt-5">
            <h3 className="section-title mb-2">{t("about")}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{provider.description}</p>
          </div>
        )}

        {/* Location */}
        <div className="px-4 mt-5">
          <h3 className="section-title mb-2">📍 Location</h3>
          <p className="text-sm text-gray-600">{provider.address}, {provider.city}, {provider.state} – {provider.pincode}</p>
        </div>

        {/* Action buttons */}
        <div className="px-4 mt-6">
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setShowRatingModal(true)} className="flex flex-col items-center gap-2 p-4 bg-amber-50 rounded-2xl hover:bg-amber-100 transition-colors">
              <span className="text-2xl">⭐</span>
              <span className="text-xs font-semibold text-amber-700">{t("rating")}</span>
            </button>
            <button onClick={() => setShowCallModal(true)} className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-colors">
              <span className="text-2xl">📞</span>
              <span className="text-xs font-semibold text-emerald-700">{t("call")}</span>
            </button>
            <button onClick={() => router.push(`/chat/${id}`)} className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors">
              <span className="text-2xl">💬</span>
              <span className="text-xs font-semibold text-blue-700">{t("message")}</span>
            </button>
          </div>
          {provider.whatsapp && (
            <a href={`https://wa.me/${provider.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-2xl font-semibold text-sm hover:bg-green-600 transition-colors">
              <span>💬</span>{t("whatsapp")}
            </a>
          )}
        </div>

        {/* Reviews */}
        <div className="px-4 mt-6">
          <h3 className="section-title mb-3">{t("reviews")}</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t("no_reviews")}</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review: any) => (
                <div key={review.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                        {review.customer?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{review.customer?.name || "Anonymous"}</p>
                        <StarRating value={review.rating} readonly size="sm" />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  {review.comment && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Book Now */}
      {provider.isAvailable && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <button onClick={() => setBookingModalOpen(true)} className="btn-primary w-full text-base">
            {t("book_now")} →
          </button>
        </div>
      )}

      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bottom-sheet p-6 w-full animate-slide-up">
            <div className="text-center">
              <div className="text-4xl mb-3">📞</div>
              <h3 className="font-bold text-lg mb-2">{t("call_confirm")}</h3>
              <p className="text-gray-500 text-sm mb-6">{provider.businessName}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCallModal(false)} className="btn-secondary flex-1">{t("cancel")}</button>
                <a href={`tel:${provider.user?.phone}`} className="btn-primary flex-1 text-center">{t("call")}</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bottom-sheet p-6 w-full animate-slide-up">
            <h3 className="font-bold text-lg mb-4">{t("rate_service")}</h3>
            <div className="flex justify-center mb-4">
              <StarRating value={myRating} onChange={setMyRating} size="lg" />
            </div>
            <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)} placeholder={t("review_placeholder")} rows={3} className="input-field mb-4 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setShowRatingModal(false)} className="btn-secondary flex-1">{t("cancel")}</button>
              <button onClick={handleRatingSubmit} className="btn-primary flex-1">{t("submit_review")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bottom-sheet p-6 w-full animate-slide-up">
            <h3 className="font-bold text-lg mb-4">{t("confirm_booking")}</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">{t("describe_problem")}</label>
                <textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder={t("problem_placeholder")} rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">{t("your_address")}</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("address_placeholder")} className="input-field" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setBookingModalOpen(false)} className="btn-secondary flex-1">{t("cancel")}</button>
              <button onClick={handleBook} disabled={bookingLoading} className="btn-primary flex-1">
                {bookingLoading ? "Booking..." : t("confirm_booking")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}