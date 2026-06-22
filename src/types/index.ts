/**
 * Shared TypeScript interfaces for the LocalServices app.
 *
 * These mirror the Prisma schema but are safe to import on the client
 * (no @prisma/client dependency). Keep in sync with schema.prisma.
 */

// ─── Enums ───────────────────────────────────────────────────────────

export type UserRole = "CUSTOMER" | "PROVIDER" | "ADMIN";
export type BookingStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type DocumentStatus = "PENDING" | "APPROVED" | "REJECTED";

// ─── User ────────────────────────────────────────────────────────────

/** Minimal provider info embedded in the auth store User. */
export interface ProviderInfo {
  id: string;
  businessName: string;
  categoryId: string;
  isApproved: boolean;
  isAvailable: boolean;
  avgRating: number;
  totalReviews: number;
}

/** Authenticated user stored in Zustand. */
export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  avatar?: string;
  role: UserRole;
  originalRole?: string;
  provider?: ProviderInfo;
}

// ─── Category ────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  nameHi: string;
  icon: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
}

// ─── Provider ────────────────────────────────────────────────────────

/** Provider as returned by GET /api/providers (list view). */
export interface ProviderListItem {
  id: string;
  businessName: string;
  description?: string | null;
  avgRating: number;
  totalReviews: number;
  totalBookings: number;
  priceMin: number;
  priceMax: number;
  isAvailable: boolean;
  isVerified: boolean;
  images: string[];
  latitude: number;
  longitude: number;
  whatsapp?: string | null;
  address: string;
  unavailableUntil?: string | null;
  distance?: number | null;
  user: { name?: string | null; avatar?: string | null; phone?: string | null };
  category: Category;
}

/** Full provider detail (admin views, provider profile, documents). */
export interface ProviderDetail extends ProviderListItem {
  userId: string;
  categoryId: string;
  city: string;
  state: string;
  pincode: string;
  serviceRadius: number;
  portfolio: string[];
  isApproved: boolean;
  isPaid: boolean;
  allowMultiple: boolean;
  idProofUrl?: string | null;
  licenseUrl?: string | null;
  idProofStatus: DocumentStatus;
  licenseStatus: DocumentStatus;
  workingHours?: unknown;
  pushSubscription?: string | null;
  createdAt: string;
  updatedAt: string;
  user: { name?: string | null; avatar?: string | null; phone?: string | null; email?: string | null };
}

// ─── Booking ─────────────────────────────────────────────────────────

/** Booking as returned by GET /api/bookings (list view). */
export interface BookingListItem {
  id: string;
  customerId: string;
  providerId: string;
  problem: string;
  status: BookingStatus;
  price?: number | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  scheduledAt?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  provider: {
    id: string;
    businessName: string;
    userId: string;
    category: Category;
    user?: { name?: string | null; email?: string | null; phone?: string | null };
  };
  customer: {
    id: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    avatar?: string | null;
  };
  review?: { id: string; rating: number } | null;
}

// ─── Review ──────────────────────────────────────────────────────────

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  rating: number;
  comment?: string | null;
  photos: string[];
  createdAt: string;
  customer: {
    id: string;
    name?: string | null;
    avatar?: string | null;
  };
}

// ─── Message ─────────────────────────────────────────────────────────

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Notification ────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

// ─── UI Helper Types ─────────────────────────────────────────────────

/** Status badge config used in bookings / dashboard. */
export interface StatusConfig {
  bg: string;
  color: string;
  label: string;
  dot: string;
}

/** Monthly earnings chart data point. */
export interface MonthlyEarning {
  month: string;
  earnings: number;
  jobs: number;
}

/** Category count for admin pie chart. */
export interface CategoryCount {
  name: string;
  value: number;
}

/** Provider status info for switch-account page. */
export interface ProviderStatusInfo {
  isApproved: boolean;
  isAvailable: boolean;
  businessName: string;
  category?: Category;
}

// ─── API Error Helper ────────────────────────────────────────────────

/** Extracts error message from Axios-like error or unknown. */
export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as Record<string, unknown>).response === "object" &&
    (err as Record<string, unknown>).response !== null
  ) {
    const resp = (err as { response: { data?: { error?: string; message?: string } } }).response;
    return resp.data?.error || resp.data?.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
