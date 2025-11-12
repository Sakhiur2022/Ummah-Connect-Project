"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useThemeSafe } from "@/lib/use-theme-safe";
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Edit2, Check, Copy } from "lucide-react";
import { ReactionBar } from "./reaction-bar";

interface PostCardProps {
  postId: number;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorImage?: string;
  content: string;
  createdAt: string;
  isHighlighted?: boolean;
  currentUserId?: string;
  onPostDeleted?: (postId: number) => void;
}

interface PostEngagement {
  totalReactions: number;
  totalComments: number;
  totalShares: number;
}

interface PostMedia {
  media_id: string;
  file_url: string;
  media_type: string;
}

export function PostCard({
  postId,
  creatorId,
  creatorName,
  creatorUsername,
  creatorImage,
  content,
  createdAt,
  isHighlighted = false,
  currentUserId,
  onPostDeleted,
}: PostCardProps) {
  const { theme } = useThemeSafe();
  const [engagement, setEngagement] = useState<PostEngagement>({
    totalReactions: 0,
    totalComments: 0,
    totalShares: 0,
  });
  const [hasReacted, setHasReacted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editingContent, setEditingContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [media, setMedia] = useState<PostMedia[]>([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const supabase = createClient();

  // Theme-aware classes
  const bgClass = theme === "light" 
    ? "bg-white border-gray-200" 
    : "bg-slate-900/40 border-slate-700/60";
  
  const textClass = theme === "light" 
    ? "text-gray-900" 
    : "text-cyan-50";
  
  const mutedTextClass = theme === "light" 
    ? "text-gray-500" 
    : "text-slate-400";
  
  const secondaryBgClass = theme === "light" 
    ? "bg-gray-100" 
    : "bg-slate-800/40";
  
  const hoverClass = theme === "light" 
    ? "hover:bg-gray-200 hover:border-amber-400" 
    : "hover:bg-slate-800/40 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10";
  
  const accentClass = theme === "light" 
    ? "text-amber-600" 
    : "text-cyan-300";
  
  const accentHoverClass = theme === "light" 
    ? "hover:text-amber-700" 
    : "hover:text-cyan-200";
  
  const buttonClass = theme === "light" 
    ? "bg-gray-100 hover:bg-gray-200 text-gray-700" 
    : "bg-slate-800/40 hover:bg-slate-700/40 text-cyan-200";
  
  const reactedButtonClass = theme === "light" 
    ? "bg-red-100 text-red-600 hover:bg-red-200" 
    : "bg-red-500/20 text-red-400 hover:bg-red-500/30";

  // Fetch current user and engagement data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);

          // Check if user has reacted
          const { data: userReaction } = await supabase
            .from("REACT")
            .select("react_id")
            .eq("post_id", postId)
            .eq("user_id", user.id)
            .single();

          setHasReacted(!!userReaction);
        }

        // Fetch engagement counts
        const { data: counter } = await supabase
          .from("POST_COUNTER")
          .select("total_reactions, total_comments, total_shares")
          .eq("post_id", postId)
          .single();

        if (counter) {
          setEngagement({
            totalReactions: counter.total_reactions || 0,
            totalComments: counter.total_comments || 0,
            totalShares: counter.total_shares || 0,
          });
        }

        // Fetch media
        const { data: mediaData } = await supabase
          .from("MEDIA")
          .select("media_id, file_url, media_type")
          .eq("post_id", postId);

        if (mediaData) {
          setMedia(mediaData);
        }
      } catch (error) {
        console.error("Error fetching post data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`post-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "POST_COUNTER",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          if (payload.new) {
            const newData = payload.new as any;
            setEngagement({
              totalReactions: newData.total_reactions || 0,
              totalComments: newData.total_comments || 0,
              totalShares: newData.total_shares || 0,
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [postId, supabase]);

  const handleReact = async () => {
    if (!userId) return;

    try {
      if (hasReacted) {
        // Remove reaction
        await supabase
          .from("REACT")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        setHasReacted(false);
        setEngagement((prev) => ({
          ...prev,
          totalReactions: Math.max(0, prev.totalReactions - 1),
        }));
      } else {
        // Add reaction
        await supabase.from("REACT").insert({
          post_id: postId,
          user_id: userId,
          reaction_type_id: 1,
        });
        setHasReacted(true);
        setEngagement((prev) => ({
          ...prev,
          totalReactions: prev.totalReactions + 1,
        }));
      }
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      // Delete media records first
      await supabase
        .from("MEDIA")
        .delete()
        .eq("post_id", postId);

      // Delete post
      await supabase
        .from("POST")
        .delete()
        .eq("post_id", postId);

      // Call parent callback
      if (onPostDeleted) {
        onPostDeleted(postId);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    }
  };

  const handleEditPost = () => {
    setEditingContent(content);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleSaveEdit = async () => {
    if (!editingContent.trim()) {
      alert("Post content cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("POST")
        .update({ content: editingContent.trim() })
        .eq("post_id", postId);

      if (error) throw error;

      // Update local content display
      alert("Post updated successfully!");
      setIsEditing(false);
      // Refresh the page to show updated content
      window.location.reload();
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingContent("");
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleShare = async () => {
    if (!userId) {
      alert("Please login to share");
      return;
    }

    try {
      const { error } = await supabase.from("Share").insert({
        post_id: postId,
        user_id: userId,
      });

      if (error) throw error;

      setEngagement((prev) => ({
        ...prev,
        totalShares: prev.totalShares + 1,
      }));

      alert("Post shared successfully!");
      setShowShareMenu(false);
    } catch (error) {
      console.error("Error sharing post:", error);
      alert("Failed to share post");
    }
  };

  const handleCopyLink = () => {
    const postLink = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className={`rounded-lg border ${bgClass} backdrop-blur-md p-4 animate-pulse h-32`} />
    );
  }

  return (
    <article className={`rounded-lg border ${bgClass} backdrop-blur-md overflow-hidden transition-all duration-200 ${hoverClass}`}>
      {/* Header */}
      <div className={`p-4 border-b ${theme === "light" ? "border-gray-200" : "border-slate-700/20"}`}>
        <div className="flex items-start justify-between">
          <Link href={`/profile/${creatorUsername}`} className="flex gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${theme === "light" ? "bg-gray-200" : "bg-slate-800/60"}`}>
              {creatorImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={creatorImage}
                  alt={creatorName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className={`font-bold ${accentClass}`}>
                  {creatorName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold ${textClass} truncate`}>
                {creatorName}
              </p>
              <p className={`text-xs ${mutedTextClass}`}>@{creatorUsername}</p>
            </div>
          </Link>

          {currentUserId === creatorId && (
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className={`p-2 rounded-full transition-colors ${theme === "light" ? "hover:bg-gray-200" : "hover:bg-slate-800/40"}`}
              >
                <MoreVertical className={`w-4 h-4 ${mutedTextClass}`} />
              </button>

              {showMenu && (
                <div className={`absolute right-0 mt-2 w-40 rounded-lg border ${theme === "light" ? "bg-white border-gray-200" : "bg-slate-800 border-slate-700"} shadow-lg z-50`}>
                  <button 
                    onClick={handleEditPost}
                    className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700 ${theme === "light" ? "text-gray-900" : "text-cyan-50"}`}
                  >
                    <Edit2 size={16} />
                    Edit Post
                  </button>
                  <button 
                    onClick={() => {
                      setShowMenu(false);
                      handleDeletePost();
                    }}
                    className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400`}
                  >
                    <Trash2 size={16} />
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 resize-none ${theme === "light" ? "bg-gray-100 border-gray-300 text-gray-900 focus:ring-amber-500" : "bg-slate-800/40 border-slate-700 text-cyan-50 focus:ring-cyan-500"}`}
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelEdit}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme === "light" ? "bg-gray-200 hover:bg-gray-300 text-gray-900" : "bg-slate-700/40 hover:bg-slate-700/60 text-cyan-100"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${theme === "light" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-cyan-600 hover:bg-cyan-700 text-white"}`}
              >
                <Check size={16} />
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <Link href={`/post/${postId}`}>
              <p className={`text-sm leading-relaxed line-clamp-3 transition-colors ${theme === "light" ? "text-gray-800 hover:text-amber-700" : "text-cyan-50 hover:text-cyan-200"}`}>
                {content}
              </p>
            </Link>
            <p className={`text-xs mt-2 ${mutedTextClass}`}>{formatDate(createdAt)}</p>
          </>
        )}
      </div>

      {/* Media Gallery */}
      {media.length > 0 && (
        <div className={`border-t ${theme === "light" ? "border-gray-200" : "border-slate-700/20"} ${media.length === 1 ? "p-0" : "p-2"}`}>
          {media.length === 1 ? (
            <div className="overflow-hidden">
              <img
                src={media[0].file_url}
                alt="Post media"
                className="w-full h-auto object-cover max-h-96"
              />
            </div>
          ) : (
            <div className="grid gap-1 grid-cols-2">
              {media.slice(0, 4).map((item, index) => (
                <div
                  key={item.media_id}
                  className={`relative overflow-hidden ${theme === "light" ? "bg-gray-200" : "bg-slate-800"} ${
                    media.length === 3 && index === 2 ? "col-span-2" : ""
                  }`}
                  style={{ paddingBottom: "100%" }}
                >
                  <img
                    src={item.file_url}
                    alt={`Post media ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                  {media.length > 4 && index === 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        +{media.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Engagement Stats */}
      <div className={`px-4 py-3 border-t ${theme === "light" ? "border-gray-200 text-gray-500" : "border-slate-700/20 text-slate-400"} text-xs flex gap-4`}>
        {engagement.totalReactions > 0 && (
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3 fill-current text-red-500" />
            {engagement.totalReactions}
          </span>
        )}
        {engagement.totalComments > 0 && (
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {engagement.totalComments}
          </span>
        )}
        {engagement.totalShares > 0 && (
          <span className="flex items-center gap-1">
            <Share2 className="w-3 h-3" />
            {engagement.totalShares}
          </span>
        )}
      </div>

      {/* Reactions Bar */}
      <div className={`px-4 py-3 border-t ${theme === "light" ? "border-gray-200" : "border-slate-700/20"}`}>
        <ReactionBar postId={postId} />
      </div>

      {/* Actions */}
      <div className={`px-4 py-3 border-t ${theme === "light" ? "border-gray-200" : "border-slate-700/20"} flex gap-3`}>
        <Link
          href={`/post/${postId}`}
          className={`flex-1 py-2 rounded-md transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium ${buttonClass}`}
        >
          <MessageCircle className="w-4 h-4" />
          Reply
        </Link>

        <div className="relative flex-1">
          <button 
            onClick={() => setShowShareMenu(!showShareMenu)}
            className={`w-full py-2 rounded-md transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium ${buttonClass}`}
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>

          {showShareMenu && (
            <div className={`absolute bottom-full mb-2 left-0 right-0 rounded-lg border shadow-lg backdrop-blur-md z-50 ${theme === "light" ? "bg-white border-gray-200" : "bg-slate-800 border-slate-700"}`}>
              <button
                onClick={handleCopyLink}
                className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors text-sm ${theme === "light" ? "hover:bg-gray-100 text-gray-700" : "hover:bg-slate-700/40 text-cyan-100"}`}
              >
                {copiedLink ? (
                  <>
                    <Check size={16} className="text-green-500" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Link
                  </>
                )}
              </button>
              <button
                onClick={handleShare}
                className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors text-sm border-t ${theme === "light" ? "hover:bg-gray-100 border-gray-200 text-gray-700" : "hover:bg-slate-700/40 border-slate-700 text-cyan-100"}`}
              >
                <Share2 size={16} />
                Share Post
              </button>
            </div>
          )}
        </div>
      </div>

      {isHighlighted && (
        <div className={`px-4 py-2 ${theme === "light" ? "bg-amber-100 border-t border-amber-200" : "bg-cyan-600/20 border-t border-cyan-500/20"}`}>
          <p className={`text-xs font-medium ${theme === "light" ? "text-amber-700" : "text-cyan-300"}`}>
            🏆 Top Highlighted Post
          </p>
        </div>
      )}
    </article>
  );
}
