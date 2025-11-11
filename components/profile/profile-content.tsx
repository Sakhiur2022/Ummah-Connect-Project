"use client";

import { useThemeSafe } from "@/lib/use-theme-safe";
import { motion } from "framer-motion";

interface ProfileContentProps {
  userId: string;
  username: string;
}

export function ProfileContent({ userId, username }: ProfileContentProps) {
  const { theme } = useThemeSafe();

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  const cardClass = theme === "light"
    ? "rounded-xl backdrop-blur-md p-6 border border-gray-200/60 bg-white/40 shadow-lg shadow-gray-200/50"
    : "rounded-xl backdrop-blur-md p-6 border border-slate-700/60 bg-slate-900/40 shadow-lg shadow-black/50";

  const headingClass = theme === "light"
    ? "text-xl font-bold mb-4 text-amber-900"
    : "text-xl font-bold mb-4 text-cyan-100";

  const subHeadingClass = theme === "light"
    ? "text-lg font-bold mb-4 text-amber-900"
    : "text-lg font-bold mb-4 text-cyan-100";

  const textClass = theme === "light"
    ? "text-amber-800"
    : "text-slate-300";

  const labelClass = theme === "light"
    ? "text-amber-700"
    : "text-slate-400";

  const valueClass = theme === "light"
    ? "font-bold text-amber-900"
    : "font-bold text-cyan-200";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* About Section */}
      <motion.div
        variants={itemVariants}
        className={cardClass}
      >
        <h2 className={headingClass}>About</h2>
        <p className={textClass}>
          Bio and information will be displayed here
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={itemVariants}
        className={cardClass}
      >
        <h3 className={subHeadingClass}>Stats</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className={labelClass}>Posts</span>
            <span className={valueClass}>0</span>
          </div>
          <div className="flex justify-between">
            <span className={labelClass}>Followers</span>
            <span className={valueClass}>0</span>
          </div>
          <div className="flex justify-between">
            <span className={labelClass}>Following</span>
            <span className={valueClass}>0</span>
          </div>
        </div>
      </motion.div>

      {/* Friends */}
      <motion.div
        variants={itemVariants}
        className={cardClass}
      >
        <h3 className={subHeadingClass}>Friends</h3>
        <p className={labelClass}>Friends will appear here</p>
      </motion.div>
    </motion.div>
  );
}
