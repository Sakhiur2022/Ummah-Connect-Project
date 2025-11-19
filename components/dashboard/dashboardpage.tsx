// ============================================
// FILE: app/dashboard/page.tsx
// ============================================
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Mail,
  User,
  Cake,
  Calendar,
  UserCircle,
  LogOut,
  Collection,
  AlertTriangle,
  Heart,
  MessageCircle,
  Share2,
  RefreshCw,
} from "lucide-react";

//Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// TypeScript Interfaces
interface UserData {
  id: number;
  full_name: string;
  email: string;
  date_of_birth: string | null;
  gender: "male" | "female";
  profile_photo: string | null;
  username?: string;
}

interface PostUser {
  full_name: string;
  username: string;
  profile_photo: string | null;
}

interface Post {
  id: number;
  content: string;
  creator_id: number;
  created_at: string;
  users?: PostUser;
  likes_count: number;
  comments_count: number;
}

// Crescent Icon Component
const CrescentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C9.34 2 6.89 2.93 5 4.46C8.03 5.93 10 9.02 10 12.5C10 15.98 8.03 19.07 5 20.54C6.89 22.07 9.34 23 12 23C17.52 23 22 18.52 22 13C22 7.48 17.52 3 12 3V2Z" />
  </svg>
);

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set current date
    const today = new Date();
    setCurrentDate(
      today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

    // Check authentication and fetch data
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      setError(null);
      // Check if user is authenticated
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        router.push("/login");
        return;
      }

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userError) throw userError;

      setUser(userData);

      // Fetch friend's posts
      await fetchFriendsPosts(authUser.id);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendsPosts = async (userId: number) => {
    try {
      setPostsLoading(true);
      setError(null);

      // Get user's friends
      const { data: friends, error: friendsError } = await supabase
        .from("friends")
        .select("friend_id")
        .eq("user_id", userId)
        .eq("status", "accepted");

      if (friendsError) throw friendsError;

      const friendIds = friends?.map((f) => f.friend_id) || [];

      if (friendIds.length === 0) {
        setPosts([]);
        setPostsLoading(false);
        return;
      }

      // Fetch posts from friends with user info
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(
          `
          id,
          content,
          creator_id,
          created_at,
          users!posts_creator_id_fkey (
            full_name,
            username,
            profile_photo
          )
        `
        )
        .in("creator_id", friendIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      // Fetch likes and comments counts separately for each post
      const postsWithCounts = await Promise.all(
        (postsData || []).map(async (post) => {
          // Get likes count
          const { count: likesCount } = await supabase
            .from("post_reactions")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          // Get comments count
          const { count: commentsCount } = await supabase
            .from("post_comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          return {
            id: post.id,
            content: post.content,
            creator_id: post.creator_id,
            created_at: post.created_at,
            users: post.users,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
          };
        })
      );

      setPosts(postsWithCounts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Failed to load posts");
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const calculateAge = (dob: string | null): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleGoToProfile = () => {
    if (user?.id) {
      router.push(`/profile/${user.id}`);
    }
  };

  const handleRefreshPosts = async () => {
    if (user?.id) {
      await fetchFriendsPosts(user.id);
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
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

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  // Not Authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-lg">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              User not found
            </h3>
            <p className="text-muted-foreground mb-6">
              Please login to access your dashboard.
            </p>
            <motion.button
              onClick={() => router.push("/login")}
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-5 h-5" />
              Login
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const age = calculateAge(user.date_of_birth);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Islamic Pattern */}
      <div className="relative bg-linear-to-r from-sidebar via-sidebar-accent to-sidebar overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'url(data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23fbbf24" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E)',
          }}
        />
        <div className="container mx-auto px-4 py-6 relative z-10">
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3">
              <CrescentIcon className="w-8 h-8 text-sidebar-primary" />
              <h1 className="text-2xl font-bold text-sidebar-foreground">
                Ummah Connect
              </h1>
            </div>

            {/* User Profile Preview */}
            <motion.button
              onClick={handleGoToProfile}
              className="flex items-center gap-2 bg-sidebar-accent/50 hover:bg-sidebar-accent/70 px-4 py-2 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-accent overflow-hidden">
                {user.profile_photo ? (
                  <img
                    src={user.profile_photo}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {user.full_name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-sidebar-foreground font-medium hidden md:inline">
                {user.full_name}
              </span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-6 flex items-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome Card */}
        <motion.div
          className="bg-card border border-border rounded-xl shadow-lg mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="border-b border-border px-6 py-4">
            <h5 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Home className="w-5 h-5 text-primary" />
              Dashboard
            </h5>
          </div>
          <div className="p-6">
            <h1 className="text-3xl font-bold text-foreground mb-6">
              Welcome, {user.full_name}! 🌙
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <motion.div
                className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border/50"
                whileHover={{ scale: 1.02, borderColor: "var(--primary)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Mail className="w-5 h-5 text-primary mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-muted-foreground block">
                    Email:
                  </span>
                  <span className="text-foreground font-medium truncate block">
                    {user.email}
                  </span>
                </div>
              </motion.div>

              {/* Full Name */}
              <motion.div
                className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border/50"
                whileHover={{ scale: 1.02, borderColor: "var(--primary)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <User className="w-5 h-5 text-primary mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-muted-foreground block">
                    Full Name:
                  </span>
                  <span className="text-foreground font-medium truncate block">
                    {user.full_name}
                  </span>
                </div>
              </motion.div>

              {/* Age */}
              {age !== null && (
                <motion.div
                  className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border/50"
                  whileHover={{ scale: 1.02, borderColor: "var(--primary)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Cake className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <span className="text-sm text-muted-foreground block">
                      Age:
                    </span>
                    <span className="text-foreground font-medium">
                      {age} years
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Current Date */}
              <motion.div
                className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border/50"
                whileHover={{ scale: 1.02, borderColor: "var(--primary)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Calendar className="w-5 h-5 text-primary mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-muted-foreground block">
                    Current Date:
                  </span>
                  <span className="text-foreground font-medium text-sm">
                    {currentDate}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap justify-end gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={handleGoToProfile}
            className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2 shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <UserCircle className="w-5 h-5" />
            Go to Profile
          </motion.button>

          <motion.button
            onClick={handleLogout}
            className="bg-muted text-muted-foreground px-6 py-3 rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center gap-2 shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </motion.button>
        </motion.div>

        {/* Posts Section */}
        <motion.div
          className="bg-card border border-border rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <h5 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Collection className="w-5 h-5 text-primary" />
              Your Friend's Posts
            </h5>

            <motion.button
              onClick={handleRefreshPosts}
              disabled={postsLoading}
              className="text-primary hover:text-primary/80 transition-colors p-2 rounded-lg hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: postsLoading ? 1 : 1.1 }}
              whileTap={{ scale: postsLoading ? 1 : 0.9 }}
            >
              <RefreshCw
                className={`w-5 h-5 ${postsLoading ? "animate-spin" : ""}`}
              />
            </motion.button>
          </div>

          <div className="p-6">
            {postsLoading && posts.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Collection className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg font-medium">
                  No posts yet
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Connect with friends to see their posts here
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      layout
                      className="bg-muted/30 border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/30 transition-all"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      {/* Post Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent overflow-hidden shrink-0">
                          {post.users?.profile_photo ? (
                            <img
                              src={post.users.profile_photo}
                              alt={post.users.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary-foreground font-bold">
                              {post.users?.full_name?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {post.users?.full_name || "Unknown User"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(post.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Post Content */}
                      <p className="text-foreground mb-4 whitespace-pre-wrap wrap-break-word">
                        {post.content}
                      </p>

                      {/* Post Stats */}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground pt-3 border-t border-border">
                        <motion.div
                          className="flex items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Heart className="w-4 h-4" />
                          <span>{post.likes_count}</span>
                        </motion.div>
                        <motion.div
                          className="flex items-center gap-1.5 hover:text-blue-500 transition-colors cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments_count}</span>
                        </motion.div>
                        <motion.div
                          className="flex items-center gap-1.5 hover:text-green-500 transition-colors cursor-pointer ml-auto"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Share2 className="w-4 h-4" />
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
