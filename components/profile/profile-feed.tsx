"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme-context";
import { Heart, ImageIcon, X, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PostCard } from "@/components/post/post-card";

interface ProfileFeedProps {
  userId: string;
  userName: string;
  userImage?: string;
  isOwnProfile?: boolean;
  currentUserId?: string;
}

interface Post {
  post_id: number;
  content: string;
  created_at: string;
  creator_id: string;
  rank?: number;
  creator?: {
    full_name: string;
    username: string;
    profile_image?: string;
  };
}

function ProfileFeedContent({ userId, userName, userImage, isOwnProfile, currentUserId }: ProfileFeedProps) {
  const { theme } = useTheme();
  // Post Composer State
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(false);

  // Posts Feed State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const supabase = createClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
  }, [userId]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      // Try to fetch from top 10 view first
      const { data: topPosts } = await supabase
        .from("user_top10_posts")
        .select("post_id, rank")
        .eq("creator_id", userId)
        .order("rank", { ascending: false });

      if (topPosts && topPosts.length > 0) {
        const postIds = topPosts.map((p) => p.post_id);
        const { data: postsData } = await supabase
          .from("POST")
          .select(
            `
            post_id,
            content,
            created_at,
            creator_id,
            creator:creator_id (
              full_name,
              username,
              profile_image
            )
          `
          )
          .in("post_id", postIds)
          .order("created_at", { ascending: false });

        if (postsData) {
          const postsWithRank = postsData.map((p: any) => ({
            ...p,
            rank: topPosts.find((tp) => tp.post_id === p.post_id)?.rank,
            creator: Array.isArray(p.creator) ? p.creator[0] : p.creator,
          }));
          setPosts(postsWithRank);
        }
      } else {
        // Fallback: fetch all posts if view not available
        const { data: allPosts } = await supabase
          .from("POST")
          .select(
            `
            post_id,
            content,
            created_at,
            creator_id,
            creator:creator_id (
              full_name,
              username,
              profile_image
            )
          `
          )
          .eq("creator_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (allPosts) {
          const postsWithCreator = allPosts.map((p: any) => ({
            ...p,
            creator: Array.isArray(p.creator) ? p.creator[0] : p.creator,
          }));
          setPosts(postsWithCreator);
        }
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

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
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      
      console.log("Starting upload for:", fileName);
      
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

      console.log("Upload successful, getting public URL...", data);

      const { data: publicUrl } = supabase.storage
        .from("post-media")
        .getPublicUrl(data.path);

      console.log("Public URL:", publicUrl.publicUrl);
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
      console.log("Creating post with content:", content.trim());
      
      // Create the post
      const { data: postData, error: postError } = await supabase
        .from("POST")
        .insert([
          {
            content: content.trim(),
            creator_id: userId,
            created_at: new Date().toISOString(),
          },
        ])
        .select("post_id")
        .single();

      if (postError || !postData) {
        console.error("Post creation error:", postError);
        throw new Error(`Failed to create post: ${postError?.message}`);
      }

      console.log("Post created with ID:", postData.post_id);

      // Upload images and create media records
      if (images.length > 0) {
        console.log("Uploading", images.length, "images...");
        const mediaRecords = [];

        for (let i = 0; i < images.length; i++) {
          console.log(`Uploading image ${i + 1}/${images.length}:`, images[i].name);
          const imageUrl = await uploadImage(images[i]);
          
          if (imageUrl) {
            console.log(`Image ${i + 1} uploaded successfully:`, imageUrl);
            mediaRecords.push({
              post_id: postData.post_id,
              file_name: images[i].name,
              file_url: imageUrl,
              media_type: "image",
              storage_bucket: "post-media",
              uploaded_by: userId,
            });
          } else {
            console.warn(`Failed to upload image ${i + 1}`);
          }
        }

        if (mediaRecords.length > 0) {
          console.log("Inserting media records:", mediaRecords);
          const { data: mediaData, error: mediaError } = await supabase
            .from("MEDIA")
            .insert(mediaRecords)
            .select();

          if (mediaError) {
            console.error("Media insert error:", mediaError);
            alert(`Failed to save media info: ${mediaError.message}`);
          } else {
            console.log("Media records created successfully:", mediaData);
          }
        } else {
          console.warn("No media records to insert");
        }
      }

      // Reset form
      setContent("");
      setImages([]);
      setImagePreviews([]);
      setIsExpanded(false);

      // Refresh posts
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
      {/* Post Composer - Only show for own profile */}
      {isOwnProfile && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl backdrop-blur-md p-6 border ${theme === "light" ? "border-gray-200/60 bg-white/40 shadow-lg shadow-gray-200/50" : "border-slate-700/60 bg-slate-900/40 shadow-lg shadow-black/50"}`}
        >
          {/* Header with avatar */}
          <div className="flex items-center gap-4 mb-4">
            {userImage ? (
              <img
                src={userImage}
                alt={userName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === "light" ? "bg-gray-300 text-gray-700" : "bg-slate-700 text-slate-300"}`}>
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <p className={`font-semibold ${theme === "light" ? "text-amber-900" : "text-cyan-100"}`}>{userName}</p>
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
      )}

      {/* Posts Feed */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className={`text-xl font-bold mb-6 ${theme === "light" ? "text-amber-900" : "text-cyan-100"}`}>
          {isOwnProfile ? "Your Top Posts" : `${userName}'s Top Posts`}
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
                  isHighlighted={post.rank !== undefined && post.rank <= 3}
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
              {isOwnProfile 
                ? "No posts yet. Start sharing your journey!"
                : `No posts yet. ${userName} hasn't started their journey yet`
              }
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export function ProfileFeed(props: ProfileFeedProps) {
  return <ProfileFeedContent {...props} />;
}
