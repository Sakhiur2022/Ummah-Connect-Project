"use client";

import { useThemeSafe } from "@/lib/use-theme-safe";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FriendsList from "./FriendsList";
import MahramList from "./MahramList";
import MahramAndFriendsCard from "./MahramAndFriendsCard";

interface ProfileContentProps {
  userId: string;
  username: string;
}

export function ProfileContent({ userId, username }: ProfileContentProps) {
  const { theme } = useThemeSafe();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalFriends, setTotalFriends] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    getCurrentUser();
  }, []);

  // Fetch total posts
  useEffect(() => {
    const fetchTotalPosts = async () => {
      try {
        const { count } = await supabase
          .from("POST")
          .select("post_id", { count: "exact" })
          .eq("creator_id", userId)
          .eq("status", "active");
        
        setTotalPosts(count || 0);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchTotalPosts();

    // Subscribe to real-time changes in POST table
    const postSubscription = supabase
      .channel("post-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "POST",
          filter: `creator_id=eq.${userId}`,
        },
        () => {
          fetchTotalPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postSubscription);
    };
  }, [userId, supabase]);

  // Fetch total friends
  useEffect(() => {
    const fetchTotalFriends = async () => {
      try {
        const { data: userAFriends } = await supabase
          .from("FRIEND")
          .select("user_b", { count: "exact" })
          .eq("user_a", userId);

        const { data: userBFriends } = await supabase
          .from("FRIEND")
          .select("user_a", { count: "exact" })
          .eq("user_b", userId);

        const totalFriendsCount = (userAFriends?.length || 0) + (userBFriends?.length || 0);
        setTotalFriends(totalFriendsCount);
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchTotalFriends();

    // Subscribe to real-time changes in FRIEND table
    const friendSubscription = supabase
      .channel("friend-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "FRIEND",
          filter: `user_a=eq.${userId},user_b=eq.${userId}`,
        },
        () => {
          fetchTotalFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendSubscription);
    };
  }, [userId, supabase]);

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
            <span className={labelClass}>Total Posts</span>
            <span className={valueClass}>{totalPosts}</span>
          </div>
          <div className="flex justify-between">
            <span className={labelClass}>Total Friends</span>
            <span className={valueClass}>{totalFriends}</span>
          </div>
        </div>
      </motion.div>

      {/* Friends */}
      <motion.div variants={itemVariants}>
        <FriendsList userId={userId} currentUserId={currentUserId} />
      </motion.div>

      {/* Mahram and Friends Card */}
      <motion.div variants={itemVariants}>
        <MahramAndFriendsCard userId={userId} currentUserId={currentUserId} />
      </motion.div>
    </motion.div>
  );
}
