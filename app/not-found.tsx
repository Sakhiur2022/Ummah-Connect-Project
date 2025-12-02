"use client";

import { Button } from "@/components/ui/button";
import { Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Header from "@/components/ui/header";
import { ProfileAnimatedBackground } from "@/components/background/profile-animated-background";
import { useThemeSafe } from "@/lib/use-theme-safe";

export default function NotFound() {
  const { theme } = useThemeSafe();

  const iconColor = theme === "light" ? "text-yellow-600" : "text-yellow-500";
  const glowColor = theme === "light" ? "bg-yellow-400/20" : "bg-yellow-500/20";
  const headingGradient =
    theme === "light"
      ? "from-yellow-600 to-yellow-400"
      : "from-primary to-primary/50";

  return (
    <div className="min-h-screen w-full">
      <Header />
      <ProfileAnimatedBackground />

      <div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <h1 className={`text-6xl sm:text-7xl font-bold text-transparent bg-clip-text bg-linear-to-r ${headingGradient} mb-2`}>
              404
            </h1>
            <div className="relative inline-block">
              <div className={`absolute inset-0 ${glowColor} blur-xl rounded-full`}></div>
              <Search className={`w-12 h-12 ${iconColor} relative mx-auto`} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            Page Not Found
          </h2>

          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved to another location.
          </p>

          <div className="flex gap-3 flex-col sm:flex-row sm:justify-center mb-4">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                className={`w-full ${
                  theme === "light"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                Back to Home
              </Button>
            </Link>
          </div>

        
        </div>
      </div>
    </div>
  );
}
