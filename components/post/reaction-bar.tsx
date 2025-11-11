"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useThemeSafe } from "@/lib/use-theme-safe";

interface ReactionBarProps {
  postId: number;
  onReactionChange?: (reactionType: string, count: number) => void;
}

interface ReactionCount {
  [key: string]: number;
}

const REACTIONS = [
  { id: 1, label: "like", emoji: "👍", description: "Agreement" },
  { id: 2, label: "love", emoji: "❤️", description: "Emotional Connection" },
  { id: 3, label: "dua", emoji: "🤲", description: "Wishing blessings" },
  { id: 4, label: "insightful", emoji: "💡", description: "Finding the post thoughtful" },
  { id: 5, label: "thankful", emoji: "🌙", description: "Barakah" },
  { id: 6, label: "chuckle", emoji: "🤭", description: "A gentle laugh" },
];

export function ReactionBar({ postId, onReactionChange }: ReactionBarProps) {
  const [reactionCounts, setReactionCounts] = useState<ReactionCount>({});
  const [userReactionId, setUserReactionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();
  const { theme } = useThemeSafe();

  useEffect(() => {
    const fetchReactions = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }

        // Fetch all reactions for this post
        const { data: reactionsData } = await supabase
          .from("REACT")
          .select("reaction_type_id")
          .eq("post_id", postId);

        if (reactionsData) {
          // Count reactions by type
          const counts: ReactionCount = {};
          REACTIONS.forEach((r) => {
            counts[r.label] = 0;
          });

          reactionsData.forEach((r: any) => {
            const reactionType = REACTIONS.find(
              (rt) => rt.id === r.reaction_type_id
            );
            if (reactionType) {
              counts[reactionType.label] =
                (counts[reactionType.label] || 0) + 1;
            }
          });

          setReactionCounts(counts);
        }

        // Check user's reaction (should be only 1 due to unique constraint)
        if (user) {
          const { data: userReactionData } = await supabase
            .from("REACT")
            .select("reaction_type_id")
            .eq("post_id", postId)
            .eq("user_id", user.id)
            .single();

          if (userReactionData) {
            setUserReactionId(userReactionData.reaction_type_id);
          }
        }
      } catch (error) {
        console.error("Error fetching reactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReactions();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`reactions-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "REACT",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          // Refetch reactions on any change
          const { data: reactionsData } = await supabase
            .from("REACT")
            .select("reaction_type_id")
            .eq("post_id", postId);

          if (reactionsData) {
            const counts: ReactionCount = {};
            REACTIONS.forEach((r) => {
              counts[r.label] = 0;
            });

            reactionsData.forEach((r: any) => {
              const reactionType = REACTIONS.find(
                (rt) => rt.id === r.reaction_type_id
              );
              if (reactionType) {
                counts[reactionType.label] =
                  (counts[reactionType.label] || 0) + 1;
              }
            });

            setReactionCounts(counts);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [postId, supabase]);

  const handleReactionClick = async (reactionTypeId: number) => {
    if (!userId) {
      alert("Please login to react");
      return;
    }

    try {
      if (userReactionId === reactionTypeId) {
        // Remove reaction (clicking same reaction again)
        await supabase
          .from("REACT")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);

        setUserReactionId(null);

        const reaction = REACTIONS.find((r) => r.id === reactionTypeId);
        if (reaction) {
          setReactionCounts((prev) => ({
            ...prev,
            [reaction.label]: Math.max(0, (prev[reaction.label] || 0) - 1),
          }));
          onReactionChange?.(reaction.label, reactionCounts[reaction.label] || 0);
        }
      } else if (userReactionId) {
        // Change reaction
        const { error } = await supabase
          .from("REACT")
          .update({ reaction_type_id: reactionTypeId })
          .eq("post_id", postId)
          .eq("user_id", userId);

        if (error) throw error;

        // Update counts
        const oldReaction = REACTIONS.find((r) => r.id === userReactionId);
        const newReaction = REACTIONS.find((r) => r.id === reactionTypeId);

        if (oldReaction && newReaction) {
          setReactionCounts((prev) => ({
            ...prev,
            [oldReaction.label]: Math.max(0, (prev[oldReaction.label] || 0) - 1),
            [newReaction.label]: (prev[newReaction.label] || 0) + 1,
          }));
        }

        setUserReactionId(reactionTypeId);
      } else {
        // Add new reaction
        const { error } = await supabase.from("REACT").insert({
          post_id: postId,
          user_id: userId,
          reaction_type_id: reactionTypeId,
        });

        if (error) throw error;

        setUserReactionId(reactionTypeId);

        const reaction = REACTIONS.find((r) => r.id === reactionTypeId);
        if (reaction) {
          setReactionCounts((prev) => ({
            ...prev,
            [reaction.label]: (prev[reaction.label] || 0) + 1,
          }));
          onReactionChange?.(reaction.label, (reactionCounts[reaction.label] || 0) + 1);
        }
      }
    } catch (error) {
      console.error("Error updating reaction:", error);
      alert("Failed to update reaction");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center gap-2 py-2">
        {REACTIONS.map((reaction) => (
          <div
            key={reaction.id}
            className={`w-10 h-10 rounded-lg animate-pulse ${theme === "light" ? "bg-gray-300/40" : "bg-slate-800/40"}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 p-2 rounded-lg border ${theme === "light" ? "bg-gray-100/40 border-gray-300/40" : "bg-slate-900/20 border-slate-700/40"}`}>
      {REACTIONS.map((reaction) => {
        const count = reactionCounts[reaction.label] || 0;
        const isUserReacted = userReactionId === reaction.id;

        return (
          <button
            key={reaction.id}
            onClick={() => handleReactionClick(reaction.id)}
            title={reaction.description}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
              isUserReacted
                ? theme === "light" 
                  ? "bg-amber-500/40 border border-amber-600/60 hover:bg-amber-500/50"
                  : "bg-cyan-600/40 border border-cyan-500/60 hover:bg-cyan-600/50"
                : theme === "light"
                ? "bg-gray-200/40 border border-gray-300/60 hover:bg-gray-200/50"
                : "bg-slate-800/40 border border-slate-700/60 hover:bg-slate-700/40"
            }`}
          >
            <span className="text-lg">{reaction.emoji}</span>
            {count > 0 && (
              <span
                className={`text-xs font-semibold ${
                  isUserReacted 
                    ? theme === "light"
                      ? "text-amber-900"
                      : "text-cyan-200"
                    : theme === "light"
                    ? "text-gray-700"
                    : "text-slate-300"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
