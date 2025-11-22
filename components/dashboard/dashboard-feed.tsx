"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useThemeSafe } from "@/lib/use-theme-safe";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, BookOpen, Calendar, Moon, ImageIcon, X, Send, Loader2 } from "lucide-react";
import { PostCard } from "@/components/post/post-card";

interface DashboardFeedProps {
  currentUserId?: string;
  currentUserName?: string;
  currentUserImage?: string;
}

interface Post {
  post_id: number;
  content: string;
  created_at: string;
  creator_id: string;
  visibility: string;
  status: string;
  creator?: {
    full_name: string;
    username: string;
    profile_image?: string;
  };
  post_counter?: {
    total_reactions: number;
    total_comments: number;
    total_shares: number;
  };
}

interface QuranAyah {
  number: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
  };
  numberInSurah: number;
  edition?: {
    identifier: string;
    language: string;
    name: string;
    englishName: string;
  };
}

export function DashboardFeed({ currentUserId, currentUserName = "User", currentUserImage }: DashboardFeedProps) {
  const { theme } = useThemeSafe();
  const supabase = createClient();

  // Greeting & Date State
  const [currentDate, setCurrentDate] = useState("");
  const [quranAyah, setQuranAyah] = useState<QuranAyah | null>(null);
  const [loadingAyah, setLoadingAyah] = useState(true);

  // Post Composer State
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(false);

  // Posts Feed State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [friends, setFriends] = useState<string[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Set current date
  useEffect(() => {
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setCurrentDate(dateStr);
  }, []);

  // Fetch random Quran ayah
  useEffect(() => {
    const fetchQuranAyah = async () => {
      try {
        setLoadingAyah(true);
        let arabicData = null;
        let attempts = 0;
        const maxAttempts = 5;

        // Retry if ayah doesn't exist
        while (((!arabicData?.data) && attempts < maxAttempts)) {
          attempts++;
          const randomSurah = Math.floor(Math.random() * 114) + 1;
          const randomAyah = Math.floor(Math.random() * 286) + 1; // Max ayahs in Quran is 286

          try {
            // Fetch Arabic with harkat - use correct API format
            const arabicUrl = `https://api.alquran.cloud/v1/ayah/${randomSurah}:${randomAyah}?edition=quran-simple`;
            
            const arabicResponse = await fetch(arabicUrl);
            
            if (!arabicResponse.ok) {
              continue;
            }
            
            arabicData = await arabicResponse.json();

            if (arabicData?.data) {
              break;
            }
          } catch (error) {
            console.error(`Attempt ${attempts}: Error fetching ayah`, error);
            continue;
          }
        }

        if (arabicData?.data) {
          console.log("Setting Quran Ayah:", arabicData.data);
          setQuranAyah(arabicData.data);
        } else {
          console.warn("Failed to fetch Quran ayah after", maxAttempts, "attempts");
        }
      } catch (error) {
        console.error("Error fetching Quran ayah:", error);
      } finally {
        setLoadingAyah(false);
      }
    };

    fetchQuranAyah();
  }, []);

  // Fetch user's friends from FRIEND table
  useEffect(() => {
    const fetchFriends = async () => {
      if (!currentUserId) return;

      try {
        const { data: userAFriends } = await supabase
          .from("FRIEND")
          .select("user_b")
          .eq("user_a", currentUserId);

        const { data: userBFriends } = await supabase
          .from("FRIEND")
          .select("user_a")
          .eq("user_b", currentUserId);

        const friendIds = [
          ...(userAFriends?.map((f) => f.user_b) || []),
          ...(userBFriends?.map((f) => f.user_a) || []),
        ];

        setFriends(friendIds);
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchFriends();
  }, [currentUserId, supabase]);

  // Fetch posts
  const fetchPosts = async () => {
    if (!currentUserId) return;

    setLoadingPosts(true);
    try {
      const postIds = [currentUserId, ...friends];

      const { data: postsData, error } = await supabase
        .from("POST")
        .select(
          `
          post_id,
          content,
          created_at,
          creator_id,
          visibility,
          status,
          creator:creator_id (
            full_name,
            username,
            profile_image
          ),
          post_counter:POST_COUNTER (
            total_reactions,
            total_comments,
            total_shares
          )
        `
        )
        .in("creator_id", postIds)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching posts:", error);
        return;
      }

      if (postsData) {
        const postsWithCreator = postsData.map((p: any) => ({
          ...p,
          creator: Array.isArray(p.creator) ? p.creator[0] : p.creator,
          post_counter: Array.isArray(p.post_counter) ? p.post_counter[0] : p.post_counter,
        }));
        setPosts(postsWithCreator);
      }
    } catch (error) {
      console.error("Error in fetchPosts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Load posts on mount and when friends change
  useEffect(() => {
    fetchPosts();
  }, [currentUserId, friends]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isUnder5MB = file.size < 5 * 1024 * 1024;
      return isImage && isUnder5MB;
    });

    if (validFiles.length + images.length > 4) {
      alert("Maximum 4 images allowed per post");
      return;
    }

    setImages((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = (e.target as FileReader | null)?.result;
        if (typeof result === "string") {
          setImagePreviews((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileName = `${currentUserId}/${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from("post-media")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        alert(`Upload failed: ${error.message}`);
        return null;
      }

      const { data: publicUrl } = supabase.storage
        .from("post-media")
        .getPublicUrl(data.path);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error("Upload exception:", error);
      alert(`Upload exception: ${error}`);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && images.length === 0) {
      alert("Please write something or add an image");
      return;
    }

    setIsLoadingPost(true);

    try {
      const { data: postData, error: postError } = await supabase
        .from("POST")
        .insert([
          {
            content: content.trim(),
            creator_id: currentUserId,
            created_at: new Date().toISOString(),
          },
        ])
        .select("post_id")
        .single();

      if (postError || !postData) {
        console.error("Post creation error:", postError);
        throw new Error(`Failed to create post: ${postError?.message}`);
      }

      if (images.length > 0) {
        const mediaRecords = [];

        for (let i = 0; i < images.length; i++) {
          const imageUrl = await uploadImage(images[i]);

          if (imageUrl) {
            mediaRecords.push({
              post_id: postData.post_id,
              file_name: images[i].name,
              file_url: imageUrl,
              media_type: "image",
              storage_bucket: "post-media",
              uploaded_by: currentUserId,
            });
          }
        }

        if (mediaRecords.length > 0) {
          const { error: mediaError } = await supabase
            .from("MEDIA")
            .insert(mediaRecords);

          if (mediaError) {
            console.error("Media insert error:", mediaError);
            alert(`Failed to save media info: ${mediaError.message}`);
          }
        }
      }

      setContent("");
      setImages([]);
      setImagePreviews([]);
      setIsExpanded(false);

      await fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsLoadingPost(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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
      className="space-y-6"
    >
      {/* Greeting Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl backdrop-blur-md p-6 border ${theme === "light" ? "border-gray-200/60 bg-white/40 shadow-lg shadow-gray-200/50" : "border-slate-700/60 bg-slate-900/40 shadow-lg shadow-black/50"}`}
      >
        <div className="flex items-center gap-3 mb-2">
          <Moon className={`w-6 h-6 ${theme === "light" ? "text-amber-700" : "text-cyan-300"}`} />
          <h1 className={`text-3xl sm:text-4xl font-bold`} style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: theme === "light" ? "#1f2937" : "#f0f9ff" }}>
            السلام عليكم ورحمة الله وبركاته
          </h1>
        </div>
        <p className={`text-lg ${theme === "light" ? "text-gray-600" : "text-slate-300"}`}>
          Welcome back, {currentUserName}
        </p>
      </motion.div>

      {/* Date and Quran Section */}
      <div className="space-y-6">
        {/* Date with Gregorian and Hijri */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl backdrop-blur-md p-6 border ${theme === "light" ? "border-gray-200/60 bg-white/40 shadow-lg" : "border-slate-700/60 bg-slate-900/40 shadow-lg"}`}
        >
          <div className="flex items-start gap-4">
            <Calendar className={`w-8 h-8 ${theme === "light" ? "text-amber-700" : "text-cyan-300"} shrink-0 mt-1`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${theme === "light" ? "text-amber-600" : "text-cyan-200"}`}>Today</p>
              <p className={`text-lg font-bold ${theme === "light" ? "text-gray-900" : "text-slate-100"}`}>{currentDate}</p>
            </div>
          </div>
        </motion.div>

        {/* Quran Ayah */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-xl backdrop-blur-md p-6 border ${theme === "light" ? "border-gray-200/60 bg-white/40 shadow-lg" : "border-slate-700/60 bg-slate-900/40 shadow-lg"}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className={`w-6 h-6 ${theme === "light" ? "text-amber-700" : "text-cyan-300"}`} />
            <h2 className={`text-lg font-bold ${theme === "light" ? "text-gray-900" : "text-slate-100"}`}>Daily Ayah</h2>
          </div>

          {loadingAyah ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-3 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
            </div>
          ) : quranAyah ? (
            <div className={`p-4 rounded-lg space-y-3 ${theme === "light" ? "bg-amber-50" : "bg-slate-700/50"}`}>
              {/* Arabic Text */}
              <p 
                className={`text-right ${theme === "light" ? "text-gray-900" : "text-slate-100"}`}
                style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", fontSize: "1.75rem", lineHeight: "2.5" }}
              >
                {quranAyah.text}
              </p>
              
              {/* Surah Reference with English Name */}
              {quranAyah.surah && (
                <p className={`text-xs ${theme === "light" ? "text-gray-600" : "text-slate-400"} text-right pt-2 border-t ${theme === "light" ? "border-amber-200" : "border-slate-600"}`}>
                  — {quranAyah.surah.name} ({quranAyah.surah.englishName}), Ayah {quranAyah.numberInSurah}
                </p>
              )}
            </div>
          ) : null}
        </motion.div>
      </div>

      {/* Post Composer */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-xl backdrop-blur-md p-6 border ${theme === "light" ? "border-gray-200/60 bg-white/40 shadow-lg shadow-gray-200/50" : "border-slate-700/60 bg-slate-900/40 shadow-lg shadow-black/50"}`}
      >
        {/* Header with avatar */}
        <div className="flex items-center gap-4 mb-4">
          {currentUserImage ? (
            <img
              src={currentUserImage}
              alt={currentUserName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === "light" ? "bg-gray-300 text-gray-700" : "bg-slate-700 text-slate-300"}`}>
              {currentUserName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <p className={`font-semibold ${theme === "light" ? "text-amber-900" : "text-cyan-100"}`}>{currentUserName}</p>
            <p className={`text-sm ${theme === "light" ? "text-amber-700" : "text-slate-400"}`}>Share your thoughts</p>
          </div>
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="What's on your mind?"
            className={`w-full p-4 rounded-lg resize-none focus:outline-none focus:ring-2 placeholder-shown:min-h-12 ${
              isExpanded ? "min-h-32" : "min-h-12"
            } transition-all ${
              theme === "light"
                ? "bg-gray-100/40 border border-gray-300/80 text-gray-900 placeholder-gray-500 focus:ring-amber-500/50"
                : "bg-slate-800/40 border border-slate-700/80 text-cyan-50 placeholder-slate-400 focus:ring-cyan-500/50"
            }`}
          />

          {/* Image previews */}
          <AnimatePresence>
            {imagePreviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                {imagePreviews.map((preview, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 sm:h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-wrap items-center gap-2 pt-4 border-t ${theme === "light" ? "border-gray-300/40" : "border-slate-700/40"}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 4 || isLoadingPost}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
                  images.length >= 4 || isLoadingPost
                    ? `opacity-50 cursor-not-allowed ${theme === "light" ? "text-gray-500" : "text-slate-400"}`
                    : `${theme === "light" ? "text-amber-700 hover:bg-gray-200/40" : "text-cyan-100 hover:bg-slate-700/40"}`
                }`}
              >
                <ImageIcon size={20} />
                <span className="hidden sm:inline">Photos</span>
                {images.length > 0 && <span>({images.length}/4)</span>}
              </button>

              <button
                type="button"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${theme === "light" ? "text-amber-700 hover:bg-gray-200/40" : "text-cyan-100 hover:bg-slate-700/40"}`}
              >
                <Heart size={20} />
                <span className="hidden sm:inline">Feeling</span>
              </button>

              <div className="flex-1" />

              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setContent("");
                  setImages([]);
                  setImagePreviews([]);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${theme === "light" ? "text-amber-700 hover:bg-gray-200/40" : "text-cyan-100 hover:bg-slate-700/40"}`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoadingPost || (!content.trim() && images.length === 0)}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                  isLoadingPost || (!content.trim() && images.length === 0)
                    ? `opacity-50 cursor-not-allowed ${theme === "light" ? "bg-amber-900/30" : "bg-cyan-900/30"}`
                    : `${theme === "light" ? "bg-amber-600/50 text-white hover:bg-amber-600/70" : "bg-cyan-600/50 text-white hover:bg-cyan-600/70"}`
                }`}
              >
                {isLoadingPost ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Post</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </form>
      </motion.div>

      {/* Posts Feed */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className={`text-xl font-bold mb-6 ${theme === "light" ? "text-amber-900" : "text-cyan-100"}`}>
          Your Feed
        </h2>

        {loadingPosts ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`rounded-xl backdrop-blur-md p-6 border h-40 animate-pulse ${theme === "light" ? "border-gray-200/60 bg-gray-50/40" : "border-slate-700/60 bg-slate-900/40"}`}
              />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {posts.map((post) => (
              <motion.div key={post.post_id} variants={itemVariants}>
                <PostCard
                  postId={post.post_id}
                  creatorId={post.creator_id}
                  creatorName={post.creator?.full_name || "Unknown"}
                  creatorUsername={post.creator?.username || "unknown"}
                  creatorImage={post.creator?.profile_image || undefined}
                  content={post.content}
                  createdAt={post.created_at}
                  currentUserId={currentUserId}
                  onPostDeleted={(postId) => {
                    setPosts(posts.filter(p => p.post_id !== postId));
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className={`rounded-xl backdrop-blur-md p-8 border text-center ${theme === "light" ? "border-gray-200/60 bg-gray-50/40 text-amber-700" : "border-slate-700/60 bg-slate-900/40 text-slate-300"}`}>
            <p>
              No posts yet. Start sharing your journey or add friends to see their posts!
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
