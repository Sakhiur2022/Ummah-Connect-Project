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
    // Log error to console for debugging
    console.error("Application error:", error);
  }, [error]);

  const iconColor = theme === "light" ? "text-red-600" : "text-red-500";
  const glowColor = theme === "light" ? "bg-red-400/20" : "bg-red-500/20";

  return (
    <div className="min-h-screen w-full">
      <ProfileAnimatedBackground />
      <Header />

      <div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className={`absolute inset-0 ${glowColor} blur-xl rounded-full`}></div>
              <AlertCircle className={`w-16 h-16 ${iconColor} relative`} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            Oops! Something went wrong
          </h1>

          <p className="text-muted-foreground mb-2 text-sm">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>

          {error.digest && (
            <p className="text-xs text-muted-foreground/60 mb-6 font-mono break-all">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3 flex-col sm:flex-row sm:justify-center">
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
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              Try Again
            </Button>
          </div>

          <Button
            onClick={() => router.push("/dashboard")}
            variant="ghost"
            className="mt-4 w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
