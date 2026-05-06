export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") || "30"), 90);

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  // ── 1. Bookings per day ──────────────────────────────────────────────────
  const recentBookings = await prisma.booking.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Build a map of date → count
  const dayMap: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    dayMap[key] = 0;
  }
  for (const b of recentBookings) {
    const key = new Date(b.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
    if (key in dayMap) dayMap[key]++;
  }
  const bookingsPerDay = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

  // ── 2. Revenue by category (exclude null prices) ─────────────────────────
  const pricedBookings = await prisma.booking.findMany({
    where: { price: { not: null } },
    select: {
      price: true,
      provider: { select: { category: { select: { name: true, icon: true } } } },
    },
  });

  const catMap: Record<string, { revenue: number; bookings: number; icon: string }> = {};
  for (const b of pricedBookings) {
    const cat = b.provider?.category?.name || "Other";
    const icon = b.provider?.category?.icon || "";
    if (!catMap[cat]) catMap[cat] = { revenue: 0, bookings: 0, icon };
    catMap[cat].revenue += b.price!;
    catMap[cat].bookings++;
  }
  const revenueByCategory = Object.entries(catMap)
    .map(([name, v]) => ({ name, icon: v.icon, revenue: Math.round(v.revenue), bookings: v.bookings }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── 3. Top providers ─────────────────────────────────────────────────────
  const providerBookings = await prisma.booking.findMany({
    where: { price: { not: null } },
    select: {
      price: true,
      providerId: true,
      provider: {
        select: {
          businessName: true,
          avgRating: true,
          totalBookings: true,
          category: { select: { name: true, icon: true } },
        },
      },
    },
  });

  const provMap: Record<
    string,
    { name: string; revenue: number; bookings: number; rating: number; category: string; icon: string }
  > = {};
  for (const b of providerBookings) {
    const pid = b.providerId;
    if (!provMap[pid]) {
      provMap[pid] = {
        name: b.provider?.businessName || "Unknown",
        revenue: 0,
        bookings: b.provider?.totalBookings || 0,
        rating: b.provider?.avgRating || 0,
        category: b.provider?.category?.name || "",
        icon: b.provider?.category?.icon || "",
      };
    }
    provMap[pid].revenue += b.price!;
  }
  const topProviders = Object.values(provMap)
    .map((p) => ({ ...p, revenue: Math.round(p.revenue) }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 10);

  // ── 4. Booking funnel ────────────────────────────────────────────────────
  const statusCounts = await prisma.booking.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const statusOrder = ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  const statusLabels: Record<string, string> = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  const countByStatus: Record<string, number> = {};
  for (const s of statusCounts) countByStatus[s.status] = s._count._all;

  const funnelData = statusOrder.map((s) => ({
    stage: statusLabels[s],
    count: countByStatus[s] || 0,
  }));

  return NextResponse.json({
    bookingsPerDay,
    revenueByCategory,
    topProviders,
    funnelData,
  });
}
