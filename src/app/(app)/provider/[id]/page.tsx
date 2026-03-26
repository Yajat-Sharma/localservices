"use client";
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
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

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
        providerId: id, problem, address, latitude, longitude,
        scheduledDate: scheduledDate || null,
        scheduledTime: scheduledTime || null,
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <TopNav showBack onBack={() => router.back()} title="Loading..." />
      <div className="p-4 space-y-4">
        <div className="h-56 skeleton rounded-3xl" />
        <div className="h-6 skeleton rounded-lg w-3/4" />
        <div className="h-4 skeleton rounded-lg w-1/2" />
        <div className="h-4 skeleton rounded-lg w-2/3" />
      </div>
    </div>
  );

  if (!provider) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <TopNav showBack onBack={() => router.back()} title={provider.businessName} />
      <div className="pb-32">

        {/* Hero Image */}
        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700">
          {provider.images?.[0] ? (
            <Image src={provider.images[0]} alt={provider.businessName} fill className="object-cover" />
          ) : provider.portfolio?.[0] ? (
            <Image src={provider.portfolio[0]} alt={provider.businessName} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-24 h-24 rounded-3xl bg-white/30 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center text-5xl">
                {provider.category.icon}
              </div>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Main Info Card */}
        <div className="px-4 -mt-6 relative z-10">
          <div className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    {provider.businessName}
                  </h1>
                  {provider.isVerified && (
                    <span className="verified-badge flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {language === "hi" ? provider.category.nameHi : provider.category.name}
                </p>
              </div>
              <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                provider.isAvailable
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-200/50 dark:border-emerald-800/50"
                  : "bg-red-500/10 text-red-600 border border-red-200/50 dark:border-red-800/50"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${provider.isAvailable ? "bg-emerald-500" : "bg-red-500"}`} />
                {provider.isAvailable ? t("available") : t("unavailable")}
              </span>
            </div>

            {/* Rating & Distance */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <StarRating value={provider.avgRating} readonly size="sm" />
                <span className="text-sm font-bold text-amber-600">{provider.avgRating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({provider.totalReviews})</span>
              </div>
              {provider.distance !== undefined && (
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z"/>
                  </svg>
                  {formatDistance(provider.distance)} away
                </span>
              )}
            </div>

            {/* Price & Service Area */}
            <div className="flex items-center justify-between mt-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-2xl">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("price_range")}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">₹{provider.priceMin} – ₹{provider.priceMax}</p>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-slate-600" />
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("service_area")}</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{provider.serviceRadius}km radius</p>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-slate-600" />
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Bookings</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{provider.totalBookings || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setShowRatingModal(true)}
              className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{t("rating")}</span>
            </button>

            <button
              onClick={() => setShowCallModal(true)}
              className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.35 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.83-1.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{t("call")}</span>
            </button>

            <button
              onClick={() => router.push(`/chat/${id}`)}
              className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">{t("message")}</span>
            </button>
          </div>

          {provider.whatsapp && (
            <a
              href={`https://wa.me/${provider.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2.5 w-full py-3 rounded-2xl font-semibold text-sm text-white transition-all"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.768.967-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.762-1.653-2.06-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.611-.916-2.207-.242-.579-.487-.5-.67-.51l-.57-.01c-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.487.71.306 1.263.489 1.695.626.712.227 1.36.195 1.872.118.571-.085 1.758-.718 2.006-1.412.248-.694.248-1.29.173-1.412-.074-.124-.272-.198-.57-.347z"/>
              </svg>
              WhatsApp
            </a>
          )}
        </div>

        {/* About */}
        {provider.description && (
          <div className="px-4 mt-5">
            <h3 className="section-title mb-2">{t("about")}</h3>
            <div className="card p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{provider.description}</p>
            </div>
          </div>
        )}

        {/* Portfolio */}
        {provider.portfolio?.length > 0 && (
          <div className="px-4 mt-5">
            <h3 className="section-title mb-3">Portfolio</h3>
            <div className="grid grid-cols-3 gap-2">
              {provider.portfolio.map((url: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(url)}
                  className="relative aspect-square rounded-2xl overflow-hidden group"
                >
                  <Image src={url} alt={`Work ${i + 1}`} fill className="object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        <div className="px-4 mt-5">
          <h3 className="section-title mb-2">Location</h3>
          <div className="card p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="10" r="3"/>
                <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z"/>
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {provider.address}, {provider.city}, {provider.state} – {provider.pincode}
            </p>
          </div>
        </div>

        {/* Reviews */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">{t("reviews")}</h3>
            {reviews.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                {reviews.length} reviews
              </span>
            )}
          </div>
          {reviews.length === 0 ? (
            <div className="card p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("no_reviews")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review: any) => (
                <div key={review.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}>
                        {review.customer?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {review.customer?.name || "Anonymous"}
                        </p>
                        <StarRating value={review.rating} readonly size="sm" />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2.5 leading-relaxed pl-0.5">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Book Now Button */}
      {provider.isAvailable && (
        <div className="fixed bottom-0 left-0 right-0 p-4 glass-nav">
          <button onClick={() => setBookingModalOpen(true)} className="btn-primary w-full text-base flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {t("book_now")}
          </button>
        </div>
      )}

      {/* Photo Lightbox */}
      {activePhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative w-full max-w-lg aspect-square rounded-3xl overflow-hidden">
            <Image src={activePhoto} alt="Portfolio" fill className="object-contain" />
          </div>
          <button
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            onClick={() => setActivePhoto(null)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bottom-sheet p-6 w-full animate-slide-up">
            <div className="text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.35 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.83-1.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{t("call_confirm")}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{provider.businessName}</p>
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
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{t("rate_service")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{provider.businessName}</p>
            <div className="flex justify-center mb-5">
              <StarRating value={myRating} onChange={setMyRating} size="lg" />
            </div>
            <textarea
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
              placeholder={t("review_placeholder")}
              rows={3}
              className="input-field mb-4 resize-none"
            />
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
          <div className="bottom-sheet p-6 w-full animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t("confirm_booking")}</h3>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Problem */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  {t("describe_problem")}
                </label>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder={t("problem_placeholder")}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              {/* Address */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  {t("your_address")}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("address_placeholder")}
                  className="input-field"
                />
              </div>

              {/* Scheduling */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Schedule (Optional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <select
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="">Any time</option>
                      <option value="08:00">8:00 AM</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="18:00">6:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Price info */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Estimated Cost</span>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  ₹{provider.priceMin} – ₹{provider.priceMax}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setBookingModalOpen(false)} className="btn-secondary flex-1">
                {t("cancel")}
              </button>
              <button onClick={handleBook} disabled={bookingLoading} className="btn-primary flex-1">
                {bookingLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Booking...
                  </span>
                ) : t("confirm_booking")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}