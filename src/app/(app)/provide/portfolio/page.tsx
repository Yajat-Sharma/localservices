"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { TopNav } from "@/components/shared/TopNav";
import { useAuthStore } from "@/lib/store";
import axios from "axios";
import toast from "react-hot-toast";

export default function PortfolioPage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    if (!user.provider) { router.replace("/provide/register"); return; }
    fetchPortfolio();
  }, [user]);

  const fetchPortfolio = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.get("/api/providers/me/details", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPortfolio(res.data.provider?.portfolio || []);
    } catch {}
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length + portfolio.length > 12) {
      toast.error("Maximum 12 photos allowed");
      return;
    }

    const newPreviews: string[] = [];
    selected.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === selected.length) {
          setPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    setFiles(prev => [...prev, ...selected]);
  };

  const handleUpload = async () => {
    if (!files.length) { toast.error("Please select photos first"); return; }
    setUploading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const formData = new FormData();
      files.forEach(file => formData.append("photos", file));

      const res = await axios.post("/api/providers/portfolio", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      setPortfolio(res.data.provider.portfolio);
      setFiles([]);
      setPreviews([]);
      toast.success(`${res.data.urls.length} photo(s) uploaded!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      await axios.delete("/api/providers/portfolio", {
        data: { url },
        headers: { Authorization: `Bearer ${token}` },
      });
      setPortfolio(prev => prev.filter(p => p !== url));
      toast.success("Photo removed");
    } catch {
      toast.error("Failed to remove photo");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <TopNav showBack onBack={() => router.back()} title="Portfolio Photos" />
      <div className="p-4 pb-32 max-w-lg mx-auto space-y-5 animate-fade-in">

        {/* Info */}
        <div className="card p-4"
          style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(79,70,229,0.06))", border: "1px solid rgba(37,99,235,0.15)" }}>
          <h3 className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-1">📸 Showcase Your Work</h3>
          <p className="text-blue-700 dark:text-blue-400 text-xs leading-relaxed">
            Upload photos of your past work to attract more customers. You can upload up to 12 photos. 
            High quality photos increase bookings by 3x!
          </p>
        </div>

        {/* Upload area */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white">Add Photos</h3>
            <span className="text-xs text-gray-500">{portfolio.length + files.length}/12</span>
          </div>

          <label
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            style={{ borderColor: "rgba(37,99,235,0.3)", background: "rgba(37,99,235,0.03)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" className="mb-2 opacity-60">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Click to add photos</span>
            <span className="text-xs text-gray-400 mt-1">JPG, PNG • Max 5MB each</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {/* Previews of new photos */}
          {previews.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">New photos ({previews.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {previews.map((preview, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                    <Image src={preview} alt={`Preview ${i}`} fill className="object-cover" />
                    <button
                      onClick={() => {
                        setPreviews(prev => prev.filter((_, idx) => idx !== i));
                        setFiles(prev => prev.filter((_, idx) => idx !== i));
                      }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >×</button>
                    <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                      <span className="text-xs text-white font-bold bg-blue-500 px-1.5 py-0.5 rounded-full">New</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Existing portfolio */}
        {portfolio.length > 0 && (
          <div className="card p-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">
              Your Portfolio ({portfolio.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {portfolio.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  <Image src={url} alt={`Portfolio ${i}`} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleDelete(url)}
                      className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {portfolio.length === 0 && files.length === 0 && (
          <div className="text-center py-8 card p-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <p className="font-bold text-gray-800 dark:text-gray-200">No portfolio photos yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload photos of your work to attract customers</p>
          </div>
        )}
      </div>

      {/* Upload button */}
      {files.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 glass-nav">
          <button onClick={handleUpload} disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2">
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading {files.length} photo(s)...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="16 16 12 12 8 16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
                Upload {files.length} Photo(s)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}