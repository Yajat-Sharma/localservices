"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { TopNav } from "@/components/shared/TopNav";
import { StarRating } from "@/components/ui/StarRating";
import { LoginPromptModal } from "@/components/ui/LoginPromptModal";
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
  const [scheduledDate, setScheduledDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [scheduledTime, setScheduledTime] = useState("");
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [loginPromptAction, setLoginPromptAction] = useState("book this service");
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const pathname = usePathname();

  // Booking Form validation and UX enhancement states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [landmark, setLandmark] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [bookingPhoto, setBookingPhoto] = useState<string | null>(null);
  const [bookingPhotoUploading, setBookingPhotoUploading] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(false);

  // Persistence & Spam protection states & refs
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const lastSubmitTimeRef = useRef(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setTimeout(() => {
      setCooldownRemaining(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldownRemaining]);

  const requireAuth = (action: string, cb: () => void) => {
    if (!user) {
      setLoginPromptAction(action);
      setLoginPromptOpen(true);
    } else {
      cb();
    }
  };

  // Generate available time slots from provider's working hours
  const getTimeSlots = () => {
    const wh = provider?.workingHours as any;
    const start = wh?.startHour ?? 8;
    const end = wh?.endHour ?? 18;
    const slots = [];
    for (let h = start; h < end; h++) {
      const label = h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
      slots.push({ value: `${String(h).padStart(2, "0")}:00`, label });
    }
    return slots;
  };

  const isDateAllowed = (dateStr: string) => {
    if (!dateStr) return true;
    const wh = provider?.workingHours as any;
    if (!wh?.days) return true;
    const dayOfWeek = new Date(dateStr + "T12:00:00").getDay();
    return (wh.days as number[]).includes(dayOfWeek);
  };

  const validateField = (fieldName: string, value: string) => {
    let errorMsg = "";
    if (fieldName === "problem") {
      const trimmed = value.trim();
      if (!trimmed) {
        errorMsg = "Please describe your problem.";
      } else if (trimmed.length < 10) {
        errorMsg = "Problem description must be at least 10 characters long.";
      } else if (trimmed.length > 500) {
        errorMsg = "Problem description cannot exceed 500 characters.";
      }
    } else if (fieldName === "address") {
      const trimmed = value.trim();
      if (!trimmed) {
        errorMsg = "Please enter your service address.";
      } else if (trimmed.length < 10) {
        errorMsg = "Address must be at least 10 characters long.";
      } else if (trimmed.length > 250) {
        errorMsg = "Address cannot exceed 250 characters.";
      }
    } else if (fieldName === "scheduledDate") {
      if (!value) {
        errorMsg = "Please select an appointment date.";
      } else {
        const todayStr = new Date().toISOString().split("T")[0];
        if (value < todayStr) {
          errorMsg = "Appointment date cannot be in the past.";
        } else if (!isDateAllowed(value)) {
          const wh = provider?.workingHours as any;
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const allowed = (wh?.days as number[] || []).map((d: number) => days[d]).join(", ");
          errorMsg = `Provider works only on: ${allowed}`;
        }
      }
    } else if (fieldName === "scheduledTime") {
      if (!value) {
        errorMsg = "Please select an appointment time.";
      }
    }

    setErrors(prev => ({
      ...prev,
      [fieldName]: errorMsg
    }));

    return !errorMsg;
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    if (fieldName === "problem") setProblem(value);
    else if (fieldName === "address") setAddress(value);
    else if (fieldName === "scheduledDate") setScheduledDate(value);
    else if (fieldName === "scheduledTime") setScheduledTime(value);

    if (touched[fieldName]) {
      validateField(fieldName, value);
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    if (fieldName === "problem") validateField(fieldName, problem);
    else if (fieldName === "address") validateField(fieldName, address);
    else if (fieldName === "scheduledDate") validateField(fieldName, scheduledDate);
    else if (fieldName === "scheduledTime") validateField(fieldName, scheduledTime);
  };

  const isFormValid = () => {
    const pTrimmed = problem.trim();
    const aTrimmed = address.trim();
    const todayStr = new Date().toISOString().split("T")[0];

    return (
      pTrimmed.length >= 10 &&
      pTrimmed.length <= 500 &&
      aTrimmed.length >= 10 &&
      aTrimmed.length <= 250 &&
      scheduledDate >= todayStr &&
      isDateAllowed(scheduledDate) &&
      scheduledTime !== ""
    );
  };

  const fillAddressWithCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setFetchingAddress(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
            {
              headers: {
                "Accept-Language": language || "en",
                "User-Agent": "Antigravity-LocalServices"
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            if (data.display_name) {
              setAddress(data.display_name);
              validateField("address", data.display_name);
              toast.success("Address updated with current location!");
            } else {
              toast.error("Failed to resolve address from coordinates.");
            }
          } else {
            toast.error("Geocoding service unavailable.");
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          toast.error("Failed to fetch address. Please type it manually.");
        } finally {
          setFetchingAddress(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Permission denied or location unavailable.");
        setFetchingAddress(false);
      }
    );
  };

  const handleBookingPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBookingPhotoUploading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post("/api/upload", fd, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookingPhoto(res.data.url);
      toast.success("Photo attached successfully!");
    } catch {
      toast.error("Photo upload failed");
    } finally {
      setBookingPhotoUploading(false);
    }
  };

  // Load draft from localStorage on page mount / provider load
  useEffect(() => {
    if (!id) return;
    try {
      const savedDraft = localStorage.getItem(`booking_draft_${id}`);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.problem) setProblem(draft.problem);
        if (draft.address) setAddress(draft.address);
        if (draft.landmark) setLandmark(draft.landmark);
        if (draft.specialInstructions) setSpecialInstructions(draft.specialInstructions);
        if (draft.scheduledDate) setScheduledDate(draft.scheduledDate);
        if (draft.scheduledTime) setScheduledTime(draft.scheduledTime);
      }
    } catch (err) {
      console.error("Failed to load booking draft:", err);
    } finally {
      setDraftLoaded(true);
    }
  }, [id]);

  // Save draft to localStorage (debounced)
  useEffect(() => {
    if (!id || !draftLoaded) return;

    const hasValue = problem.trim() || address.trim() || landmark.trim() || specialInstructions.trim() || scheduledTime;
    if (!hasValue) {
      try {
        localStorage.removeItem(`booking_draft_${id}`);
      } catch (err) {
        console.error("Failed to clear empty booking draft:", err);
      }
      return;
    }

    const timer = setTimeout(() => {
      try {
        const draft = {
          problem,
          address,
          landmark,
          specialInstructions,
          scheduledDate,
          scheduledTime
        };
        localStorage.setItem(`booking_draft_${id}`, JSON.stringify(draft));
      } catch (err) {
        console.error("Failed to save booking draft:", err);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [id, problem, address, landmark, specialInstructions, scheduledDate, scheduledTime, draftLoaded]);

  const fetchProvider = useCallback(async () => {
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
  }, [id, latitude, longitude, router]);

  useEffect(() => { fetchProvider(); }, [fetchProvider]);

  const handleBook = async () => {
    // 1. Cooldown check
    if (cooldownRemaining > 0) {
      toast.error(`Please wait ${cooldownRemaining}s before submitting another booking.`);
      return;
    }

    // 2. Double-click debounce (throttle triggers within 2 seconds)
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 2000) {
      return;
    }
    lastSubmitTimeRef.current = now;

    // 3. Mutex guard
    if (isSubmitting || bookingLoading) return;

    // Touch all fields to show error states if any are invalid
    const allTouched = {
      problem: true,
      address: true,
      scheduledDate: true,
      scheduledTime: true
    };
    setTouched(allTouched);

    const isProblemValid = validateField("problem", problem);
    const isAddressValid = validateField("address", address);
    const isDateValid = validateField("scheduledDate", scheduledDate);
    const isTimeValid = validateField("scheduledTime", scheduledTime);

    if (!isProblemValid || !isAddressValid || !isDateValid || !isTimeValid) {
      let firstInvalidId = "";
      if (!isProblemValid) firstInvalidId = "booking-problem";
      else if (!isAddressValid) firstInvalidId = "booking-address";
      else if (!isDateValid) firstInvalidId = "booking-scheduledDate";
      else if (!isTimeValid) firstInvalidId = "booking-scheduledTime";

      if (firstInvalidId) {
        const element = document.getElementById(firstInvalidId);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    if (!user) { setLoginPromptOpen(true); return; }

    // Activate loading state & mutex
    setIsSubmitting(true);
    setBookingLoading(true);

    // Build the full address with landmark if provided
    const fullAddress = address.trim() + (landmark.trim() ? `, (Landmark: ${landmark.trim()})` : "");

    // Build the full problem description with special instructions and photos if provided
    let fullProblem = problem.trim();
    if (specialInstructions.trim()) {
      fullProblem += `\n\nSpecial Instructions: ${specialInstructions.trim()}`;
    }
    if (bookingPhoto) {
      fullProblem += `\n\nAttached Photo: ${bookingPhoto}`;
    }

    const token = localStorage.getItem("auth_token");
    try {
      await axios.post("/api/bookings", {
        providerId: id,
        problem: fullProblem,
        address: fullAddress,
        latitude,
        longitude,
        scheduledDate: scheduledDate || null,
        scheduledTime: scheduledTime || null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(t("booking_pending"));
      setBookingModalOpen(false);

      // Enforce client-side cooldown of 10 seconds
      setCooldownRemaining(10);

      // Clear draft on successful submission
      try {
        localStorage.removeItem(`booking_draft_${id}`);
      } catch (err) {
        console.error("Failed to clear booking draft:", err);
      }

      // Reset form states
      setProblem("");
      setAddress("");
      setLandmark("");
      setSpecialInstructions("");
      setBookingPhoto(null);
      setTouched({});
      setErrors({});

      router.push("/bookings");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setIsSubmitting(false);
      setBookingLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!myRating) { toast.error("Please select a rating"); return; }
    const token = localStorage.getItem("auth_token");
    try {
      await axios.post(`/api/providers/${id}/review`, {
        rating: myRating, comment: myComment, photos: reviewPhotos,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Review submitted! Thank you 🙏");
      setShowRatingModal(false);
      setMyRating(0); setMyComment(""); setReviewPhotos([]);
      fetchProvider();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    }
  };

  const handleReviewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (reviewPhotos.length + files.length > 3) { toast.error("Max 3 photos"); return; }
    setPhotoUploading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const urls = await Promise.all(files.map(async (file) => {
        const fd = new FormData(); fd.append("file", file);
        const res = await axios.post("/api/upload", fd, { headers: { Authorization: `Bearer ${token}` } });
        return res.data.url as string;
      }));
      setReviewPhotos(prev => [...prev, ...urls].slice(0, 3));
    } catch { toast.error("Photo upload failed"); }
    finally { setPhotoUploading(false); }
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

            {/* Trust Badges Panel */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              {provider.isVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Verified
                </span>
              )}
              {(provider.totalBookings || 0) > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                  <span>🏆</span> {provider.totalBookings} Jobs Done
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                <span>⚡</span> Fast Responder
              </span>
              {provider.address && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <span>🏘️</span> {provider.address.split(",")[0].trim()}
                </span>
              )}
            </div>

            {/* Rating & Distance */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <StarRating value={provider.avgRating} readonly size="sm" />
                <span className="text-sm font-bold text-amber-600">{provider.avgRating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({provider.totalReviews})</span>
              </div>
              {provider.distance !== undefined && (
                <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/5 px-2 py-1 rounded-full">
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
              onClick={() => requireAuth("rate this provider", () => setShowRatingModal(true))}
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
              onClick={() => router.push(`/bookings`)}
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
              href={`https://wa.me/${provider.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${provider.businessName}, I found your profile on LocalServices and would like to inquire about your services.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.768.967-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.762-1.653-2.06-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.611-.916-2.207-.242-.579-.487-.5-.67-.51l-.57-.01c-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.487.71.306 1.263.489 1.695.626.712.227 1.36.195 1.872.118.571-.085 1.758-.718 2.006-1.412.248-.694.248-1.29.173-1.412-.074-.124-.272-.198-.57-.347z"/>
              </svg>
              Chat on WhatsApp
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
                  {/* Review Photos */}
                  {review.photos?.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {review.photos.map((url: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => setActivePhoto(url)}
                          className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-700 hover:opacity-90 transition-opacity"
                        >
                          <Image src={url} alt={`Review photo ${i + 1}`} fill className="object-cover" sizes="120px" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        from={pathname}
        action={loginPromptAction}
      />

      {/* Book Now Button */}
      {provider.isAvailable && (
        <div className="fixed bottom-0 left-0 right-0 p-4 glass-nav">
          <button
            onClick={() => requireAuth("book this service", () => setBookingModalOpen(true))}
            className="btn-primary w-full text-base flex items-center justify-center gap-2"
          >
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
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowRatingModal(false)}>
          <div className="bottom-sheet p-6 w-full animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{t("rate_service")}</h3>
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

            {/* Photo Upload */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                📸 Add before/after photos <span className="text-gray-400 font-normal">(optional, max 3)</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {reviewPhotos.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={url} alt={`photo ${i}`} fill className="object-cover" sizes="80px" />
                    <button
                      onClick={() => setReviewPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
                {reviewPhotos.length < 3 && (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors flex-shrink-0">
                    {photoUploading ? (
                      <span className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span className="text-xs text-purple-400 mt-1 font-medium">Add</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleReviewPhotoUpload} multiple />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowRatingModal(false); setReviewPhotos([]); }} className="btn-secondary flex-1">{t("cancel")}</button>
              <button onClick={handleRatingSubmit} disabled={!myRating || photoUploading} className="btn-primary flex-1">
                {photoUploading ? "Uploading..." : t("submit_review")}
              </button>
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
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                aria-label="Close booking modal"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Problem Description */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="booking-problem" className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                    {t("describe_problem")} <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <span className="text-xs text-gray-400 font-medium" aria-live="polite">
                    {problem.trim().length} / 500
                  </span>
                </div>
                <textarea
                  id="booking-problem"
                  value={problem}
                  onChange={(e) => handleFieldChange("problem", e.target.value)}
                  onBlur={() => handleFieldBlur("problem")}
                  placeholder="Describe the issue (e.g., Kitchen sink leaking, fan not working, wiring issue in bedroom)."
                  rows={3}
                  maxLength={500}
                  className={`input-field resize-none ${touched.problem && errors.problem ? '!border-red-500 focus:!ring-red-500/20' : ''}`}
                  aria-required="true"
                  aria-invalid={touched.problem && !!errors.problem ? "true" : "false"}
                  aria-describedby={touched.problem && errors.problem ? "problem-error" : undefined}
                />
                {touched.problem && errors.problem && (
                  <p id="problem-error" className="text-xs text-red-500 mt-1 font-medium" role="alert">
                    {errors.problem}
                  </p>
                )}
              </div>

              {/* Service Address */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="booking-address" className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                    {t("your_address")} <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={fillAddressWithCurrentLocation}
                    disabled={fetchingAddress}
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    {fetchingAddress ? (
                      <span className="w-3 h-3 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>📍</span>
                    )}
                    {fetchingAddress ? "Locating..." : "Use Current Location"}
                  </button>
                </div>
                <input
                  id="booking-address"
                  type="text"
                  value={address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  onBlur={() => handleFieldBlur("address")}
                  placeholder="House No., Street, Area, Landmark (optional), City"
                  className={`input-field ${touched.address && errors.address ? '!border-red-500 focus:!ring-red-500/20' : ''}`}
                  aria-required="true"
                  aria-invalid={touched.address && !!errors.address ? "true" : "false"}
                  aria-describedby={touched.address && errors.address ? "address-error" : undefined}
                />
                {touched.address && errors.address && (
                  <p id="address-error" className="text-xs text-red-500 mt-1 font-medium" role="alert">
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Landmark (Optional) */}
              <div>
                <label htmlFor="booking-landmark" className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Landmark <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </label>
                <input
                  id="booking-landmark"
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Apollo Hospital, opposite Metro Station"
                  className="input-field"
                />
              </div>

              {/* Scheduling Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="booking-scheduledDate" className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                    Date of Appointment <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="booking-scheduledDate"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => handleFieldChange("scheduledDate", e.target.value)}
                    onBlur={() => handleFieldBlur("scheduledDate")}
                    min={new Date().toISOString().split("T")[0]}
                    className={`input-field text-sm ${touched.scheduledDate && errors.scheduledDate ? '!border-red-500 focus:!ring-red-500/20' : ''}`}
                    aria-required="true"
                    aria-invalid={touched.scheduledDate && !!errors.scheduledDate ? "true" : "false"}
                    aria-describedby={touched.scheduledDate && errors.scheduledDate ? "scheduledDate-error" : undefined}
                  />
                  {touched.scheduledDate && errors.scheduledDate && (
                    <p id="scheduledDate-error" className="text-xs text-red-500 mt-1 font-medium" role="alert">
                      {errors.scheduledDate}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="booking-scheduledTime" className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                    Time of Appointment <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="booking-scheduledTime"
                    value={scheduledTime}
                    onChange={(e) => handleFieldChange("scheduledTime", e.target.value)}
                    onBlur={() => handleFieldBlur("scheduledTime")}
                    className={`input-field text-sm ${touched.scheduledTime && errors.scheduledTime ? '!border-red-500 focus:!ring-red-500/20' : ''}`}
                    aria-required="true"
                    aria-invalid={touched.scheduledTime && !!errors.scheduledTime ? "true" : "false"}
                    aria-describedby={touched.scheduledTime && errors.scheduledTime ? "scheduledTime-error" : undefined}
                  >
                    <option value="">Select a time</option>
                    {getTimeSlots().map(slot => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                  {touched.scheduledTime && errors.scheduledTime && (
                    <p id="scheduledTime-error" className="text-xs text-red-500 mt-1 font-medium" role="alert">
                      {errors.scheduledTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Special Instructions (Optional) */}
              <div>
                <label htmlFor="booking-specialInstructions" className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Special Instructions <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </label>
                <textarea
                  id="booking-specialInstructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Call before arriving, entrance through back gate"
                  rows={2}
                  className="input-field resize-none"
                />
              </div>

              {/* Attach Photo (Optional) */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  📸 Attach Photo <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </p>
                <div className="flex gap-2 items-center">
                  {bookingPhoto ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                      <Image src={bookingPhoto} alt="attached issue photo" fill className="object-cover" sizes="64px" />
                      <button
                        type="button"
                        onClick={() => setBookingPhoto(null)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white"
                        aria-label="Remove attached photo"
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-700 cursor-pointer hover:border-purple-500 transition-colors bg-purple-50/20 dark:bg-purple-900/10">
                      {bookingPhotoUploading ? (
                        <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      )}
                      <span className="text-xs text-purple-700 dark:text-purple-300 font-bold">
                        {bookingPhotoUploading ? "Uploading..." : "Upload Photo"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleBookingPhotoUpload} disabled={bookingPhotoUploading} />
                    </label>
                  )}
                </div>
              </div>

              {/* Price info & Disclaimer */}
              <div className="space-y-1.5">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-between">
                  <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Estimated Cost</span>
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                    ₹{provider.priceMin} – ₹{provider.priceMax}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center italic">
                  * Final price may vary depending on inspection and scope of work.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setBookingModalOpen(false)} className="btn-secondary flex-1" disabled={bookingLoading}>
                {t("cancel")}
              </button>
              <button
                onClick={handleBook}
                disabled={bookingLoading || bookingPhotoUploading}
                className={`btn-primary flex-1 ${(!isFormValid() && !bookingLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
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