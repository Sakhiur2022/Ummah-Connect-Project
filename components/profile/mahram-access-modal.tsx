"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { useThemeSafe } from "@/lib/use-theme-safe";

interface MahramAccessModalProps {
  profileOwnerId: string;
  currentUserId?: string;
  profileOwnerName: string;
  reason: string;
}

export default function MahramAccessModal({
  profileOwnerId,
  currentUserId,
  profileOwnerName,
  reason,
}: MahramAccessModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { theme } = useThemeSafe();

  const handleSendMahramRequest = async () => {
    if (!currentUserId) {
      setError("You must be logged in to send a mahram request");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "send_mahram_request",
        {
          p_requester_id: currentUserId,
          p_target_id: profileOwnerId,
        }
      );

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      if (data && data[0]?.success) {
        setError(null);
        // Show success message
        alert("Mahram request sent! " + profileOwnerName + " will review your request.");
        router.push("/dashboard");
      } else {
        setError(data?.[0]?.message || "Failed to send mahram request");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative backdrop-blur-md border rounded-2xl p-8 max-w-md w-full shadow-2xl transition-colors ${
          theme === "light"
            ? "bg-[oklch(0.96_0.02_60)] border-[oklch(0.9_0.03_60)]"
            : "bg-[oklch(0.12_0.03_240)] border-[oklch(0.25_0.04_240)]"
        }`}
      >
        {/* SVG Icon */}
        <div className="flex justify-center mb-6">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              theme === "light"
                ? "bg-linear-to-br from-[oklch(0.65_0.12_35)] to-[oklch(0.7_0.14_30)]"
                : "bg-linear-to-br from-[oklch(0.75_0.15_45)] to-[oklch(0.65_0.12_35)]"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-white"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <circle cx="12" cy="18" r="1" fill="white" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2
          className={`text-2xl font-bold text-center mb-3 ${
            theme === "light"
              ? "text-[oklch(0.15_0.02_240)]"
              : "text-[oklch(0.95_0.01_60)]"
          }`}
        >
          Profile Protected
        </h2>

        {/* Reason */}
        <p
          className={`text-center mb-6 ${
            theme === "light"
              ? "text-[oklch(0.45_0.05_60)]"
              : "text-[oklch(0.65_0.02_60)]"
          }`}
        >
          {reason || "This profile is protected and requires mahram verification."}
        </p>

        {/* Islamic Message */}
        <p
          className={`text-center text-sm mb-6 italic ${
            theme === "light"
              ? "text-[oklch(0.45_0.05_60)]"
              : "text-[oklch(0.65_0.02_60)]"
          }`}
        >
          "And tell the believing women to reduce [some] of their vision and guard their private parts..."
          <br />
          <span className="text-xs">- Quran 24:31</span>
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSendMahramRequest}
            disabled={isLoading}
            className={`w-full font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              theme === "light"
                ? "bg-[oklch(0.65_0.12_35)] hover:bg-[oklch(0.7_0.14_30)] disabled:bg-[oklch(0.65_0.12_35)] disabled:opacity-50 text-[oklch(0.98_0.01_60)]"
                : "bg-[oklch(0.75_0.15_45)] hover:bg-[oklch(0.8_0.16_50)] disabled:bg-[oklch(0.75_0.15_45)] disabled:opacity-50 text-[oklch(0.08_0.02_240)]"
            }`}
          >
            {isLoading && <Loader className="w-4 h-4 animate-spin" />}
            {isLoading ? "Sending..." : "Send Mahram Request"}
          </button>

          <button
            onClick={() => router.back()}
            className={`w-full font-semibold py-3 rounded-lg transition-all duration-200 ${
              theme === "light"
                ? "bg-[oklch(0.85_0.05_60)] hover:bg-[oklch(0.8_0.04_60)] text-[oklch(0.15_0.02_240)]"
                : "bg-[oklch(0.18_0.04_240)] hover:bg-[oklch(0.22_0.05_240)] text-[oklch(0.95_0.01_60)]"
            }`}
          >
            Go Back
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className={`mt-4 p-3 border rounded-lg text-sm ${
              theme === "light"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-red-900/20 border-red-700/50 text-red-300"
            }`}
          >
            {error}
          </div>
        )}

        {/* Info */}
        <p
          className={`text-xs text-center mt-6 ${
            theme === "light"
              ? "text-[oklch(0.45_0.05_60)]"
              : "text-[oklch(0.65_0.02_60)]"
          }`}
        >
          Send a mahram request to view this profile. The user will receive a notification and can approve your request.
        </p>
      </div>
    </div>
  );
}
