"use client";

import { Button } from "@/components/ui/button";
import { Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Header from "@/components/ui/header";
import { ProfileAnimatedBackground } from "@/components/background/profile-animated-background";
import { useThemeSafe } from "@/lib/use-theme-safe";

function NotFoundContent() {
  const { theme } = useThemeSafe();

  return (
    <div className="min-h-screen w-full">
      <Header />
      <ProfileAnimatedBackground />

      <div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <div className={`max-w-md w-full rounded-xl backdrop-blur-md p-8 border text-center ${
          theme === "light"
            ? "border-amber-300 bg-white/70 shadow-lg shadow-amber-200/40"
            : "border-slate-700/60 bg-slate-900/40 shadow-lg shadow-black/50"
        }`}>
          <div className="mb-6">
            <h1 className={`text-6xl sm:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${
              theme === "light"
                ? "from-amber-600 to-amber-400"
                : "from-cyan-400 to-blue-500"
            } mb-4`}>
              404
            </h1>
            <div className="relative inline-block">
              <div className={`absolute inset-0 blur-xl rounded-full ${
                theme === "light" ? "bg-amber-400/20" : "bg-cyan-500/20"
              }`}></div>
              <Search className={`w-12 h-12 relative mx-auto ${
                theme === "light" ? "text-amber-600" : "text-cyan-400"
              }`} />
            </div>
          </div>

          <h2 className={`text-2xl font-bold mb-3 ${
            theme === "light" ? "text-amber-950" : "text-cyan-100"
          }`}>
            Page Not Found
          </h2>

          <p className={`mb-8 ${
            theme === "light" ? "text-amber-700" : "text-slate-300"
          }`}>
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
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-cyan-600 hover:bg-cyan-700 text-white"
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

export default function NotFound() {
  return <NotFoundContent />;
}
