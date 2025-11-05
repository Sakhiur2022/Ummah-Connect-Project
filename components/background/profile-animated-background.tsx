"use client";

import { useRef } from "react";
import { useTheme } from "@/lib/theme-context";
import { motion } from "framer-motion";

interface ProfileAnimatedBackgroundProps {
  className?: string;
}

export function ProfileAnimatedBackground({
  className = "",
}: ProfileAnimatedBackgroundProps) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLDivElement>(null);

  const backgroundImage =
    theme === "light"
      ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/profile-background-light.png-KOY6IR3SkVSAzUaxEkXrzyBnOuZOdx.jpeg"
      : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/profile-background-dark-mode.png-gAaejDyGtvgILpA8Us9iiWkmTYtlc2.jpeg";

  const filterClass =
    theme === "light"
      ? "brightness-100 contrast-105 saturate-110"
      : "brightness-90 contrast-110 saturate-120";

  return (
    <div className={`fixed inset-0 -z-50 overflow-hidden ${className}`}>
      {/* Background Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat ${filterClass}`}
        style={{
          backgroundImage: `url('${backgroundImage}')`,
          backgroundAttachment: "fixed",
        }}
      />

      {theme === "light" ? (
        <>
          {/* Light mode: Spiritual, serene overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-200/20 via-transparent to-amber-50/30 mix-blend-multiply" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-white/5 to-white/10" />

          {/* Animated light orbs for spiritual feel */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-20 right-1/4 w-96 h-96 bg-amber-200/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </>
      ) : (
        <>
          {/* Dark mode: Cyberpunk, neon overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/50 to-black/60 mix-blend-overlay" />
          <div className="absolute inset-0 bg-radial-gradient from-cyan-500/5 via-transparent to-purple-500/5" />

          {/* Animated neon orbs for cyberpunk feel */}
          <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1.5s" }}
          />
        </>
      )}

      {/* Glassmorphism overlay for content area */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
    </div>
  );
}
