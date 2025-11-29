"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader, Clock, AlertCircle } from "lucide-react";
import { useThemeSafe } from "@/lib/use-theme-safe";

interface MahramAccessModalProps {
  profileOwnerId: string;
  currentUserId?: string;
  profileOwnerName: string;
  reason: string;
}

interface CooldownInfo {
  has_cooldown: boolean;
  expires_at: string;
  days_remaining: number;
  hours_remaining: number;
  formatted_time: string;
}

export default function MahramAccessModal({
  profileOwnerId,
  currentUserId,
  profileOwnerName,
  reason,
}: MahramAccessModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownInfo, setCooldownInfo] = useState<CooldownInfo | null>(null);
  const [checkingCooldown, setCheckingCooldown] = useState(true);
  const [liveTimer, setLiveTimer] = useState<string>("");
  const router = useRouter();
  const supabase = createClient();
  const { theme } = useThemeSafe();

  // Check cooldown status on mount
  useEffect(() => {
    const checkCooldown = async () => {
      if (!currentUserId) {
        setCheckingCooldown(false);
        return;
      }

      try {
        const { data, error: rpcError } = await supabase.rpc(
          "get_mahram_cooldown_info",
          {
            p_requester_id: currentUserId,
            p_target_id: profileOwnerId,
          }
        );

        if (rpcError) {
          console.error("Cooldown check error:", rpcError);
        } else if (data && data[0]) {
          setCooldownInfo(data[0]);
        }
      } catch (err) {
        console.error("Error checking cooldown:", err);
      } finally {
        setCheckingCooldown(false);
      }
    };

    checkCooldown();
  }, [currentUserId, profileOwnerId]);

  // Update live timer every second
  useEffect(() => {
    if (!cooldownInfo?.has_cooldown || !cooldownInfo?.expires_at) return;

    const updateTimer = () => {
      const expiresAt = new Date(cooldownInfo.expires_at).getTime();
      const now = new Date().getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setLiveTimer("Cooldown expired - You can send a request now");
        setCooldownInfo(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (days > 0) {
        setLiveTimer(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setLiveTimer(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setLiveTimer(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [cooldownInfo]);

  const handleSendMahramRequest = async () => {
    if (!currentUserId) {
      setError("You must be logged in to send a mahram request");
      return;
    }

    if (cooldownInfo?.has_cooldown) {
      setError("You are still in cooldown. Please wait before sending another request.");
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
              cooldownInfo?.has_cooldown
                ? theme === "light"
                  ? "bg-linear-to-br from-[oklch(0.8_0.12_35)] to-[oklch(0.75_0.10_30)]"
                  : "bg-linear-to-br from-[oklch(0.65_0.14_45)] to-[oklch(0.55_0.12_35)]"
                : theme === "light"
                ? "bg-linear-to-br from-[oklch(0.65_0.12_35)] to-[oklch(0.7_0.14_30)]"
                : "bg-linear-to-br from-[oklch(0.75_0.15_45)] to-[oklch(0.65_0.12_35)]"
            }`}
          >
            {cooldownInfo?.has_cooldown ? (
              <Clock className="w-8 h-8 text-white" />
            ) : (
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
            )}
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
          {cooldownInfo?.has_cooldown ? "Request on Cooldown" : "Profile Protected"}
        </h2>

        {/* Cooldown Timer Section */}
        {cooldownInfo?.has_cooldown && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              theme === "light"
                ? "bg-[oklch(0.95_0.02_35)] border-[oklch(0.85_0.05_35)]"
                : "bg-[oklch(0.18_0.04_35)] border-[oklch(0.25_0.04_35)]"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock
                className={`w-5 h-5 ${
                  theme === "light"
                    ? "text-[oklch(0.65_0.12_35)]"
                    : "text-[oklch(0.75_0.15_45)]"
                }`}
              />
              <span
                className={`font-semibold ${
                  theme === "light"
                    ? "text-[oklch(0.45_0.05_35)]"
                    : "text-[oklch(0.75_0.15_45)]"
                }`}
              >
                Time Remaining
              </span>
            </div>
            <div
              className={`text-center text-3xl font-bold font-mono ${
                theme === "light"
                  ? "text-[oklch(0.65_0.12_35)]"
                  : "text-[oklch(0.75_0.15_45)]"
              }`}
            >
              {liveTimer || "Loading..."}
            </div>
            <p
              className={`text-xs text-center mt-3 ${
                theme === "light"
                  ? "text-[oklch(0.45_0.05_60)]"
                  : "text-[oklch(0.65_0.02_60)]"
              }`}
            >
              After your mahram request was rejected, a 7-day cooldown period was activated.
              You can send another request once this timer expires.
            </p>
          </div>
        )}

        {/* Reason (when not in cooldown) */}
        {!cooldownInfo?.has_cooldown && (
          <p
            className={`text-center mb-6 ${
              theme === "light"
                ? "text-[oklch(0.45_0.05_60)]"
                : "text-[oklch(0.65_0.02_60)]"
            }`}
          >
            {reason || "This profile is protected and requires mahram verification."}
          </p>
        )}

        {/* Islamic Message */}
        {!cooldownInfo?.has_cooldown && (
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
        )}

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSendMahramRequest}
            disabled={isLoading || checkingCooldown || cooldownInfo?.has_cooldown}
            className={`w-full font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              cooldownInfo?.has_cooldown
                ? theme === "light"
                  ? "bg-[oklch(0.85_0.05_60)] text-[oklch(0.45_0.05_60)] cursor-not-allowed opacity-60"
                  : "bg-[oklch(0.18_0.04_240)] text-[oklch(0.65_0.02_60)] cursor-not-allowed opacity-60"
                : theme === "light"
                ? "bg-[oklch(0.65_0.12_35)] hover:bg-[oklch(0.7_0.14_30)] disabled:bg-[oklch(0.65_0.12_35)] disabled:opacity-50 text-[oklch(0.98_0.01_60)]"
                : "bg-[oklch(0.75_0.15_45)] hover:bg-[oklch(0.8_0.16_50)] disabled:bg-[oklch(0.75_0.15_45)] disabled:opacity-50 text-[oklch(0.08_0.02_240)]"
            }`}
          >
            {isLoading && <Loader className="w-4 h-4 animate-spin" />}
            {checkingCooldown
              ? "Checking..."
              : cooldownInfo?.has_cooldown
              ? "Request Blocked (Cooldown Active)"
              : "Send Mahram Request"}
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
            className={`mt-4 p-3 border rounded-lg text-sm flex gap-2 items-start ${
              theme === "light"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-red-900/20 border-red-700/50 text-red-300"
            }`}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
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
          {cooldownInfo?.has_cooldown
            ? "Once the cooldown expires, you'll be able to send a new mahram request."
            : "Send a mahram request to view this profile. The user will receive a notification and can approve your request."}
        </p>
      </div>
    </div>
  );
}
