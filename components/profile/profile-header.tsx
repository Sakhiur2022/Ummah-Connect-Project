"use client";

import { useTheme } from "@/lib/theme-context";
import { motion } from "framer-motion";

interface ProfileHeaderProps {
  user: any;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`pt-32 pb-12 px-4 sm:px-6 lg:px-8 ${
        theme === "light"
          ? "bg-gradient-to-b from-white/40 via-white/20 to-transparent backdrop-blur-md"
          : "bg-gradient-to-b from-slate-900/40 via-slate-900/20 to-transparent backdrop-blur-md"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Banner section with background image preview */}
        <div
          className={`relative -mx-4 sm:-mx-6 lg:-mx-8 h-48 sm:h-64 rounded-b-2xl overflow-hidden backdrop-blur-sm mb-6 ${
            theme === "light"
              ? "bg-gradient-to-br from-sky-300/30 to-amber-200/30"
              : "bg-gradient-to-br from-cyan-900/30 to-purple-900/30"
          }`}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                theme === "light"
                  ? "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/profile-background-light.png-KOY6IR3SkVSAzUaxEkXrzyBnOuZOdx.jpeg)"
                  : "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/profile-background-dark-mode.png-gAaejDyGtvgILpA8Us9iiWkmTYtlc2.jpeg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </div>

        {/* Profile Info */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className={`relative -mt-24 sm:-mt-20 w-32 h-32 sm:w-40 sm:h-40 rounded-full ring-4 ${
              theme === "light"
                ? "ring-white/80 bg-gradient-to-br from-amber-100 to-yellow-100"
                : "ring-slate-800/80 bg-gradient-to-br from-cyan-900 to-purple-900"
            } flex items-center justify-center font-bold text-3xl ${
              theme === "light" ? "text-amber-900" : "text-cyan-300"
            } backdrop-blur-md shadow-2xl`}
          >
            {user.profile_image ? (
              <img
                src={user.profile_image || "/placeholder.svg"}
                alt={user.full_name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              user.full_name?.charAt(0) || "U"
            )}
          </motion.div>

          <div className="flex-1 mt-6 sm:mt-0 sm:mb-2">
            <h1
              className={`text-3xl sm:text-4xl font-bold mb-1 ${
                theme === "light" ? "text-amber-950" : "text-cyan-100"
              }`}
            >
              {user.full_name}
            </h1>
            <p
              className={`text-lg ${
                theme === "light" ? "text-amber-700/80" : "text-cyan-300/80"
              }`}
            >
              @{user.username}
            </p>
            {user.bio && (
              <p
                className={`mt-2 ${
                  theme === "light" ? "text-amber-900/70" : "text-slate-300"
                }`}
              >
                {user.bio}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
