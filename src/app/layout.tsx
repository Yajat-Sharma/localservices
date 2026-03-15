import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LocalServices - Find trusted local services near you",
  description: "Connect with verified local service providers near you",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-center" toastOptions={{ duration: 3000, style: { background: "#fff", color: "#1a1a1a", borderRadius: "12px", boxShadow: "0 4px 24px rgba(0,0,0,0.12)", fontSize: "14px" } }} />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
