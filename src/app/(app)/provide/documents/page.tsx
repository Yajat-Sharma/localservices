"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { TopNav } from "@/components/shared/TopNav";
import { useAuthStore } from "@/lib/store";
import axios from "axios";
import toast from "react-hot-toast";

export default function DocumentsPage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [idProof, setIdProof] = useState<File | null>(null);
  const [license, setLicense] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    if (!user.provider) { router.replace("/provide/register"); return; }
    fetchProvider();
  }, [user]);

  const fetchProvider = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.get("/api/providers/me/details", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProvider(res.data.provider);
    } catch {}
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "id" | "license"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "id") {
        setIdProof(file);
        setIdPreview(reader.result as string);
      } else {
        setLicense(file);
        setLicensePreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!idProof && !license) {
      toast.error("Please select at least one document");
      return;
    }
    setLoading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const formData = new FormData();
      if (idProof) formData.append("idProof", idProof);
      if (license) formData.append("license", license);

      await axios.post("/api/providers/documents", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Documents uploaded! Admin will review shortly.");
      router.replace("/provide/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "APPROVED") return <span className="tag tag-green">✓ Approved</span>;
    if (status === "REJECTED") return <span className="tag tag-red">✕ Rejected</span>;
    return <span className="tag tag-orange">⏳ Pending Review</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav showBack onBack={() => router.back()} title="Verification Documents" />
      <div className="p-4 pb-32 max-w-lg mx-auto space-y-5 animate-fade-in">

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <h3 className="font-bold text-blue-900 text-sm mb-1">🔒 Why we need documents?</h3>
          <p className="text-blue-700 text-xs leading-relaxed">
            Document verification builds trust with customers. Verified providers get a ✓ badge
            and appear higher in search results. Your documents are stored securely and only reviewed by admins.
          </p>
        </div>

        {/* ID Proof */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-900">🪪 ID Proof</h3>
              <p className="text-xs text-gray-500 mt-0.5">Aadhaar, PAN, Voter ID, Passport</p>
            </div>
            {provider?.idProofStatus && getStatusBadge(provider.idProofStatus)}
          </div>

          {/* Current uploaded doc */}
          {provider?.idProofUrl && !idPreview && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Currently uploaded:</p>
              <div className="relative h-32 rounded-xl overflow-hidden bg-gray-100">
                <Image src={provider.idProofUrl} alt="ID Proof" fill className="object-cover" />
              </div>
            </div>
          )}

          {/* Preview */}
          {idPreview && (
            <div className="mb-3 relative">
              <div className="relative h-40 rounded-xl overflow-hidden bg-gray-100">
                <Image src={idPreview} alt="ID Preview" fill className="object-contain" />
              </div>
              <button
                onClick={() => { setIdProof(null); setIdPreview(null); }}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
              >×</button>
            </div>
          )}

          <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${idPreview ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"}`}>
            <span className="text-xl mb-1">📎</span>
            <span className="text-sm text-gray-500">
              {idProof ? idProof.name : "Tap to upload ID proof"}
            </span>
            <span className="text-xs text-gray-400 mt-0.5">JPG, PNG or PDF • Max 5MB</span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange(e, "id")}
              className="hidden"
            />
          </label>
        </div>

        {/* License */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-900">📜 Business License / Certificate</h3>
              <p className="text-xs text-gray-500 mt-0.5">Trade license, skill certificate, or any relevant document</p>
            </div>
            {provider?.licenseStatus && getStatusBadge(provider.licenseStatus)}
          </div>

          {/* Current uploaded doc */}
          {provider?.licenseUrl && !licensePreview && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Currently uploaded:</p>
              <div className="relative h-32 rounded-xl overflow-hidden bg-gray-100">
                <Image src={provider.licenseUrl} alt="License" fill className="object-cover" />
              </div>
            </div>
          )}

          {/* Preview */}
          {licensePreview && (
            <div className="mb-3 relative">
              <div className="relative h-40 rounded-xl overflow-hidden bg-gray-100">
                <Image src={licensePreview} alt="License Preview" fill className="object-contain" />
              </div>
              <button
                onClick={() => { setLicense(null); setLicensePreview(null); }}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
              >×</button>
            </div>
          )}

          <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${licensePreview ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"}`}>
            <span className="text-xl mb-1">📎</span>
            <span className="text-sm text-gray-500">
              {license ? license.name : "Tap to upload license"}
            </span>
            <span className="text-xs text-gray-400 mt-0.5">JPG, PNG or PDF • Max 5MB</span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange(e, "license")}
              className="hidden"
            />
          </label>
        </div>

        {/* Verification steps */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-900 mb-3">📋 Verification Process</h3>
          <div className="space-y-3">
            {[
              { step: "1", title: "Upload Documents", desc: "Upload your ID and license", done: !!(provider?.idProofUrl || provider?.licenseUrl) },
              { step: "2", title: "Admin Review", desc: "Our team reviews within 24 hours", done: provider?.idProofStatus === "APPROVED" || provider?.licenseStatus === "APPROVED" },
              { step: "3", title: "Get Verified Badge", desc: "✓ badge appears on your profile", done: provider?.isVerified },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.done ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {s.done ? "✓" : s.step}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${s.done ? "text-emerald-700" : "text-gray-700"}`}>{s.title}</p>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <button
          onClick={handleUpload}
          disabled={loading || (!idProof && !license)}
          className="btn-primary w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </span>
          ) : "Upload Documents"}
        </button>
      </div>
    </div>
  );
}