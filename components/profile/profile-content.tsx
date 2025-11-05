"use client";

import { useTheme } from "@/lib/theme-context";
import { motion } from "framer-motion";

interface ProfileContentProps {
  userId: string;
  username: string;
}

export function ProfileContent({ userId, username }: ProfileContentProps) {
  const { theme } = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <div
            className={`rounded-xl backdrop-blur-md p-6 border ${
              theme === "light"
                ? "bg-white/40 border-white/60 shadow-lg"
                : "bg-slate-900/40 border-slate-700/60 shadow-lg shadow-black/50"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-4 ${
                theme === "light" ? "text-amber-950" : "text-cyan-100"
              }`}
            >
              About
            </h2>
            <p
              className={
                theme === "light" ? "text-amber-900/80" : "text-slate-300"
              }
            >
              Bio and information will be displayed here
            </p>
          </div>

          {/* Posts Section */}
          <div
            className={`rounded-xl backdrop-blur-md p-6 border ${
              theme === "light"
                ? "bg-white/40 border-white/60 shadow-lg"
                : "bg-slate-900/40 border-slate-700/60 shadow-lg shadow-black/50"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-4 ${
                theme === "light" ? "text-amber-950" : "text-cyan-100"
              }`}
            >
              Posts
            </h2>
            <p
              className={
                theme === "light" ? "text-amber-900/80" : "text-slate-300"
              }
            >
              User posts will be displayed here
            </p>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Stats */}
          <div
            className={`rounded-xl backdrop-blur-md p-6 border ${
              theme === "light"
                ? "bg-white/40 border-white/60 shadow-lg"
                : "bg-slate-900/40 border-slate-700/60 shadow-lg shadow-black/50"
            }`}
          >
            <h3
              className={`text-lg font-bold mb-4 ${
                theme === "light" ? "text-amber-950" : "text-cyan-100"
              }`}
            >
              Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span
                  className={
                    theme === "light" ? "text-amber-900/70" : "text-slate-400"
                  }
                >
                  Posts
                </span>
                <span
                  className={`font-bold ${
                    theme === "light" ? "text-amber-950" : "text-cyan-200"
                  }`}
                >
                  0
                </span>
              </div>
              <div className="flex justify-between">
                <span
                  className={
                    theme === "light" ? "text-amber-900/70" : "text-slate-400"
                  }
                >
                  Followers
                </span>
                <span
                  className={`font-bold ${
                    theme === "light" ? "text-amber-950" : "text-cyan-200"
                  }`}
                >
                  0
                </span>
              </div>
              <div className="flex justify-between">
                <span
                  className={
                    theme === "light" ? "text-amber-900/70" : "text-slate-400"
                  }
                >
                  Following
                </span>
                <span
                  className={`font-bold ${
                    theme === "light" ? "text-amber-950" : "text-cyan-200"
                  }`}
                >
                  0
                </span>
              </div>
            </div>
          </div>

          {/* Friends */}
          <div
            className={`rounded-xl backdrop-blur-md p-6 border ${
              theme === "light"
                ? "bg-white/40 border-white/60 shadow-lg"
                : "bg-slate-900/40 border-slate-700/60 shadow-lg shadow-black/50"
            }`}
          >
            <h3
              className={`text-lg font-bold mb-4 ${
                theme === "light" ? "text-amber-950" : "text-cyan-100"
              }`}
            >
              Friends
            </h3>
            <p
              className={
                theme === "light" ? "text-amber-900/70" : "text-slate-400"
              }
            >
              Friends will appear here
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
