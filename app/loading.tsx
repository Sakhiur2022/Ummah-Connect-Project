"use client";

import { Loader2 } from "lucide-react";
import Header from "@/components/ui/header";
import { ProfileAnimatedBackground } from "@/components/background/profile-animated-background";
import { useThemeSafe } from "@/lib/use-theme-safe";

function LoadingContent() {
  const { theme } = useThemeSafe();

  return (
    <div className="min-h-screen w-full">
      <ProfileAnimatedBackground />
      <Header />
      
      <div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <div className={`max-w-md w-full rounded-xl backdrop-blur-md p-8 border ${
          theme === "light"
            ? "border-amber-300 bg-white/70 shadow-lg shadow-amber-200/40"
            : "border-slate-700/60 bg-slate-900/40 shadow-lg shadow-black/50"
        }`}>
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
              <Loader2 className="w-12 h-12 text-primary relative animate-spin" />
            </div>
            <h2 className={`text-xl font-bold mb-3 ${
              theme === "light" ? "text-amber-950" : "text-cyan-100"
            }`}>
              Loading...
            </h2>
            <p className={`text-sm max-w-xs mx-auto ${
              theme === "light" ? "text-amber-700" : "text-slate-300"
            }`}>
              Please wait while we fetch your content
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return <LoadingContent />;
}
