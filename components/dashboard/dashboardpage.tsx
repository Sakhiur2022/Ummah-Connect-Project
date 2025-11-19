// dashboardpage.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, RefreshCw, Star, Heart, MessageCircle, Trophy, Zap } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

/* ---------------------------
   Types
--------------------------- */
type Gender = "male" | "female" | "other" | null;

interface UserData {
  id: string;
  full_name: string;
  email: string;
  date_of_birth?: string | null;
  gender?: Gender;
  profile_photo?: string | null;
  username?: string | null;
}

interface PostUser {
  full_name?: string;
  username?: string;
  profile_photo?: string | null;
}

interface Post {
  id: string;
  content: string;
  creator_id: string;
  created_at: string;
  users?: PostUser | null;
  likes_count: number;
  comments_count: number;
}

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  score: number;
  rank?: number;
}

interface IbadahStats {
  date: string;
  prayers: number;
  quran_pages: number;
  fasting_hours: number;
}

/* ---------------------------
   Utility Functions
--------------------------- */
const calculateAge = (dob?: string | null): number | null => {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age;
};

const formatRelativeTime = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

/* ---------------------------
   Ibadah Tracker Component
--------------------------- */
function IbadahTracker({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ prayers: 3, quran_pages: 2, fasting_hours: 8 });
  const [error, setError] = useState<string | null>(null);

  const increment = (field: keyof typeof counts, delta = 1) =>
    setCounts((prev) => ({ ...prev, [field]: Math.max(0, prev[field] + delta) }));

  const syncData = async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 1000)); // simulate server call
    } catch {
      setError("Failed to sync ibadah data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-2 border-blue-500/30 rounded-2xl p-5 shadow-2xl overflow-hidden group hover:border-blue-400/50 transition-all duration-300"
    >
      <div className="grid grid-cols-3 gap-4 mb-4">
        {["prayers", "quran_pages", "fasting_hours"].map((field) => (
          <div
            key={field}
            className="relative p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/20 hover:border-blue-400/50 transition-all"
          >
            <p className="text-xs text-blue-300 mb-2 uppercase font-semibold tracking-wide">
              {field === "prayers" ? "Prayers" : field === "quran_pages" ? "Quran Pages" : "Fasting (hrs)"}
            </p>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{counts[field as keyof typeof counts]}</div>
              <div className="flex gap-1">
                <button
                  onClick={() => increment(field as keyof typeof counts, -1)}
                  className="w-8 h-8 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 font-bold hover:scale-110 transition-all"
                >
                  −
                </button>
                <button
                  onClick={() => increment(field as keyof typeof counts, 1)}
                  className="w-8 h-8 bg-green-500/20 border border-green-400/30 rounded-lg text-green-300 font-bold hover:scale-110 transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={syncData}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-blue-500/70 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync
        </motion.button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-400/30 p-3 rounded-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------------------------
   Leaderboard Component
--------------------------- */
function Leaderboard() {
  const [leaders] = useState<LeaderboardEntry[]>([
    { user_id: "user1", full_name: "Ahmed Hassan", score: 1250, rank: 1 },
    { user_id: "user2", full_name: "Fatima Ali", score: 1180, rank: 2 },
    { user_id: "user3", full_name: "Mohammed Ibrahim", score: 1090, rank: 3 },
    { user_id: "user4", full_name: "Zainab Khan", score: 950, rank: 4 },
    { user_id: "user5", full_name: "Sara Omar", score: 870, rank: 5 },
  ]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400 to-orange-500";
    if (rank === 2) return "from-gray-300 to-gray-400";
    if (rank === 3) return "from-amber-600 to-amber-700";
    return "from-blue-500 to-cyan-500";
  };

  return (
    <motion.div className="relative bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border-2 border-purple-500/30 rounded-2xl p-5 shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-purple-400" />
        <h3 className="font-bold text-lg text-white">Leaderboard</h3>
      </div>
      <ol className="space-y-3">
        {leaders.map((l) => (
          <li
            key={l.user_id}
            className="flex items-center justify-between p-3 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-purple-500/20"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRankColor(l.rank!)} flex items-center justify-center font-bold text-white`}
              >
                {l.rank === 1 ? <Star className="w-5 h-5" fill="currentColor" /> : l.rank}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-white truncate">{l.full_name}</div>
                <div className="text-xs text-purple-300">@{l.user_id.slice(0, 8)}</div>
              </div>
            </div>
            <div className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {l.score} pts
            </div>
          </li>
        ))}
      </ol>
    </motion.div>
  );
}

/* ---------------------------
   Ibadah Dashboard Chart
--------------------------- */
function IbadahDashboard({ userId }: { userId: string }) {
  const [stats] = useState<IbadahStats[]>([
    { date: "2024-11-13", prayers: 3, quran_pages: 2, fasting_hours: 6 },
    { date: "2024-11-14", prayers: 4, quran_pages: 3, fasting_hours: 8 },
    { date: "2024-11-15", prayers: 5, quran_pages: 2, fasting_hours: 5 },
    { date: "2024-11-16", prayers: 3, quran_pages: 4, fasting_hours: 7 },
    { date: "2024-11-17", prayers: 4, quran_pages: 3, fasting_hours: 8 },
    { date: "2024-11-18", prayers: 5, quran_pages: 5, fasting_hours: 6 },
    { date: "2024-11-19", prayers: 3, quran_pages: 2, fasting_hours: 8 },
  ]);

  const chartData = {
    labels: stats.map((s) => s.date.slice(5)),
    datasets: [
      { label: "Prayers", data: stats.map((s) => s.prayers), borderColor: "#fbbf24", backgroundColor: "rgba(251,191,36,0.2)", tension: 0.4, borderWidth: 3, pointRadius: 6, pointHoverRadius: 8, pointBackgroundColor: "#fbbf24", pointBorderColor: "#1e293b", pointBorderWidth: 2 },
      { label: "Quran Pages", data: stats.map((s) => s.quran_pages), borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.2)", tension: 0.4, borderWidth: 3, pointRadius: 6, pointHoverRadius: 8, pointBackgroundColor: "#3b82f6", pointBorderColor: "#1e293b", pointBorderWidth: 2 },
      { label: "Fasting hrs", data: stats.map((s) => s.fasting_hours), borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.2)", tension: 0.4, borderWidth: 3, pointRadius: 6, pointHoverRadius: 8, pointBackgroundColor: "#10b981", pointBorderColor: "#1e293b", pointBorderWidth: 2 },
    ],
  };

  return (
    <motion.div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-2 border-blue-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden mb-6">
      <h3 className="font-bold text-lg text-white mb-4">Ibadah Dashboard (Last 7 Days)</h3>
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
        <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: "bottom", labels: { color: "#94a3b8", font: { size: 12, weight: "bold" }, padding: 15 } }, tooltip: { backgroundColor: "rgba(15, 23, 42, 0.9)", titleColor: "#fff", bodyColor: "#cbd5e1", cornerRadius: 8 } }, scales: { x: { ticks: { color: "#64748b" }, grid: { color: "rgba(59,130,246,0.1)" } }, y: { ticks: { color: "#64748b" }, grid: { color: "rgba(59,130,246,0.1)" } } } }} />
      </div>
    </motion.div>
  );
}

/* ---------------------------
   Main Dashboard Page
--------------------------- */
export default function DashboardPage() {
  const [user] = useState<UserData>({
    id: "user-123",
    full_name: "Ahmed Hassan",
    email: "ahmed@example.com",
    date_of_birth: "1990-05-15",
    gender: "male",
    profile_photo: "/user-avatar.jpg",
    username: "ahmedhassan",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6 space-y-6 text-white relative overflow-hidden">
      <motion.div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">Dashboard</h1>
        <motion.button className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2"><LogOut className="w-4 h-4" /> Logout</motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div className="bg-slate-900/50 rounded-2xl p-6 text-center shadow-2xl">
          <img src={user.profile_photo} alt="Avatar" className="w-28 h-28 rounded-full mx-auto mb-4 border-4 border-cyan-500/50" />
          <h2 className="font-bold text-xl">{user.full_name}</h2>
          <p className="text-cyan-300">@{user.username}</p>
          <p className="mt-2 text-blue-200">{user.gender}, Age: {calculateAge(user.date_of_birth)}</p>
        </motion.div>

        <IbadahTracker userId={user.id} />
        <Leaderboard />
      </div>

      <IbadahDashboard userId={user.id} />
    </div>
  );
}
