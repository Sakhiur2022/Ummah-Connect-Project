"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/header";
import { ProfileAnimatedBackground } from "@/components/background/profile-animated-background";
import { useThemeSafe } from "@/lib/use-theme-safe";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const { theme } = useThemeSafe();

  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full">
      <ProfileAnimatedBackground />
      <Header />

      <div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <div className={`max-w-md w-full rounded-xl backdrop-blur-md p-8 border ${
          theme === "light"
            ? "border-red-300 bg-white/70 shadow-lg shadow-red-200/40"
            : "border-red-900/60 bg-red-950/40 shadow-lg shadow-red-900/50"
        }`}>
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className={`absolute inset-0 blur-xl rounded-full ${
                  theme === "light" ? "bg-red-400/20" : "bg-red-500/20"
                }`}></div>
                <AlertCircle className={`w-16 h-16 relative ${
                  theme === "light" ? "text-red-600" : "text-red-500"
                }`} />
              </div>
            </div>

            <h1 className={`text-3xl font-bold mb-2 ${
              theme === "light" ? "text-red-950" : "text-red-100"
            }`}>
              Oops! Something went wrong
            </h1>

            <p className={`mb-4 text-sm ${
              theme === "light" ? "text-red-700" : "text-red-200"
            }`}>
              {error.message || "An unexpected error occurred. Please try again."}
            </p>

            {error.digest && (
              <p className={`text-xs mb-6 font-mono break-all ${
                theme === "light" ? "text-red-600/60" : "text-red-300/60"
              }`}>
                Error ID: {error.digest}
              </p>
            )}

            <div className="flex gap-3 flex-col sm:flex-row sm:justify-center mb-4">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button
                onClick={reset}
                className={`w-full sm:w-auto ${
                  theme === "light"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                Try Again
              </Button>
            </div>

            <Button
              onClick={() => router.push("/dashboard")}
              variant="ghost"
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
