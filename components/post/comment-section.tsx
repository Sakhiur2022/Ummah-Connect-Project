"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme-context";
import { Heart, Reply, MoreVertical, Send, Loader2 } from "lucide-react";

interface CommentSectionProps {
  postId: number;
  maxDisplay?: number;
}

interface Comment {
  id: string;
  user_id: string;
  post_id: number;
  content: string;
  created_at: string;
  creator?: {
    full_name: string;
    username: string;
    profile_image?: string;
  };
  reactionCount?: number;
  userReacted?: boolean;
}

export function CommentSection({
  postId,
  maxDisplay = 5,
}: CommentSectionProps) {
  const { theme } = useTheme();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  // Theme-aware classes
  const inputBgClass = theme === "light"
    ? "bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500"
    : "bg-slate-800/40 border-slate-700/40 text-cyan-50 placeholder-slate-400";

  const commentBgClass = theme === "light"
    ? "bg-gray-100 border-gray-300"
    : "bg-slate-800/40 border-slate-700/40";

  const textClass = theme === "light"
    ? "text-gray-900"
    : "text-cyan-50";

  const secondaryTextClass = theme === "light"
    ? "text-gray-600"
    : "text-cyan-200";

  const mutedTextClass = theme === "light"
    ? "text-gray-500"
    : "text-slate-400";

  const buttonClass = theme === "light"
    ? "bg-amber-500 hover:bg-amber-600 text-white"
    : "bg-cyan-600/50 hover:bg-cyan-600/70 text-cyan-50";

  const avatarBgClass = theme === "light"
    ? "bg-gray-300"
    : "bg-slate-800/60";

  const avatarTextClass = theme === "light"
    ? "text-amber-600"
    : "text-cyan-300";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }

        // Fetch comments
        const { data: commentsData } = await supabase
          .from("COMMENTS")
          .select(
            `
            id,
            user_id,
            post_id,
            content,
            created_at,
            creator:user_id (
              full_name,
              username,
              profile_image
            )
          `
          )
          .eq("post_id", postId)
          .order("created_at", { ascending: false })
          .limit(maxDisplay);

        if (commentsData) {
          const formattedComments = commentsData.map((c: any) => ({
            ...c,
            creator: Array.isArray(c.creator) ? c.creator[0] : c.creator,
          }));
          setComments(formattedComments);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription for new comments
    const subscription = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "COMMENTS",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const newCommentData = payload.new as any;
          
          // Fetch full comment data with creator info
          const { data: fullComment } = await supabase
            .from("COMMENTS")
            .select(
              `
              id,
              user_id,
              post_id,
              content,
              created_at,
              creator:user_id (
                full_name,
                username,
                profile_image
              )
            `
            )
            .eq("id", newCommentData.id)
            .single();

          if (fullComment) {
            setComments((prev) => [
              {
                ...fullComment,
                creator: Array.isArray(fullComment.creator)
                  ? fullComment.creator[0]
                  : fullComment.creator,
              },
              ...prev.slice(0, maxDisplay - 1),
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [postId, maxDisplay, supabase]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !userId) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("COMMENTS").insert([
        {
          user_id: userId,
          post_id: postId,
          content: newComment.trim(),
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return commentDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      {userId && (
        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <div className="flex gap-3">
            <div className={`w-8 h-8 rounded-full flex-shrink-0 ${avatarBgClass} flex items-center justify-center`}>
              <span className={`text-xs font-bold ${avatarTextClass}`}>You</span>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              maxLength={500}
              className={`flex-1 p-2 border rounded-lg ${inputBgClass} focus:outline-none focus:ring-2 ${theme === "light" ? "focus:ring-amber-500/50" : "focus:ring-cyan-500/50"} resize-none text-sm`}
              rows={2}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-xs ${mutedTextClass}`}>
              {newComment.length}/500
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className={`flex items-center gap-2 px-4 py-2 ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Post
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className={`text-center py-4 text-sm ${mutedTextClass}`}>
            Loading comments...
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex-shrink-0 ${avatarBgClass} flex items-center justify-center overflow-hidden`}>
                {comment.creator?.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={comment.creator.profile_image}
                    alt={comment.creator.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className={`text-xs font-bold ${avatarTextClass}`}>
                    {comment.creator?.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className={`border rounded-lg p-2 ${commentBgClass}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-semibold ${secondaryTextClass}`}>
                        {comment.creator?.full_name}
                      </p>
                      <p className={`text-xs ${mutedTextClass}`}>
                        @{comment.creator?.username}
                      </p>
                    </div>
                    <button className={`p-1 rounded transition-colors ${theme === "light" ? "hover:bg-gray-200" : "hover:bg-slate-700/40"}`}>
                      <MoreVertical className={`w-3 h-3 ${mutedTextClass}`} />
                    </button>
                  </div>

                  <p className={`text-sm mt-1 break-words ${textClass}`}>
                    {comment.content}
                  </p>
                </div>

                <div className={`flex items-center gap-2 mt-1 text-xs ${mutedTextClass}`}>
                  <span>{formatDate(comment.created_at)}</span>
                  <button className={`flex items-center gap-1 ${theme === "light" ? "hover:text-amber-600" : "hover:text-cyan-300"}`}>
                    <Heart size={12} />
                  </button>
                  <button className={`flex items-center gap-1 ${theme === "light" ? "hover:text-amber-600" : "hover:text-cyan-300"}`}>
                    <Reply size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={`text-center py-4 text-sm ${mutedTextClass}`}>
            No comments yet. Be the first!
          </div>
        )}
      </div>
    </div>
  );
}
