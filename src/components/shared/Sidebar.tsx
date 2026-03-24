"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { useLanguage } from "@/i18n/LanguageContext";
interface SidebarProps { isOpen: boolean; onClose: () => void; }
export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { t } = useLanguage();
  const router = useRouter();
  const handleLogout = () => { logout(); onClose(); router.push("/"); };
  const navItems = [
    { icon: "👤", label: t("profile"), href: "/profile" },
    { icon: "📋", label: t("service_history"), href: "/history" },
    { icon: "📦", label: t("bookings"), href: "/bookings" },
    { icon: "⚙️", label: t("settings"), href: "/settings" },
  ];
  if (user?.role === "ADMIN") navItems.push({ icon: "🛠️", label: t("admin_panel"), href: "/admin" });
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-72 z-50 transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", boxShadow: "4px 0 40px rgba(0,0,0,0.12)", borderRight: "1px solid rgba(255,255,255,0.5)" }}>
        <div className="bg-blue-600 px-6 pt-12 pb-8">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white rounded-full">✕</button>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl text-white font-bold">{user?.name?.[0]?.toUpperCase() || "👤"}</div>
            <div>
              <p className="text-white font-bold">{user?.name || "User"}</p>
              <p className="text-white/70 text-xs">{user?.phone}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all font-medium text-sm">
              <span className="text-lg">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-medium text-sm">
            <span className="text-lg">🚪</span>{t("logout")}
          </button>
        </div>
      </div>
    </>
  );
}