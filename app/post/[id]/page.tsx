"use client";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useThemeSafe } from "@/lib/use-theme-safe";
import { PostCard } from "@/components/post/post-card";
import { CommentSection } from "@/components/post/comment-section";
import Header from "@/components/ui/header";
import { ProfileAnimatedBackground } from "@/components/background/profile-animated-background";
import { useEffect, useState } from "react";

interface PostPageProps {
  params: {
    id: string;
  };
}

interface Post {
  post_id: number;
  content: string;
  created_at: string;
  creator_id: string;
  creator?: {
    full_name: string;
    username: string;
    profile_image?: string;
  };
}

interface Counter {
  total_reactions: number;
  total_comments: number;
  total_shares: number;
}

export default function PostPage({ params }: PostPageProps) {
  const { theme } = useThemeSafe();
  const supabase = createClient();
  const [post, setPost] = useState<Post | null>(null);
  const [counter, setCounter] = useState<Counter | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const postId = parseInt(params.id, 10);

      if (isNaN(postId)) {
        notFound();
      }

      try {
        // Fetch post
        const { data: postData } = await supabase
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
          .eq("post_id", postId)
          .single();

        if (!postData) {
          notFound();
        }

        const creator = Array.isArray(postData.creator) ? postData.creator[0] : postData.creator;
        setPost({ ...postData, creator });

        // Fetch engagement data
        const { data: counterData } = await supabase
          .from("post_counter")
          .select("total_reactions, total_comments, total_shares")
          .eq("post_id", postId)
          .single();

        if (counterData) {
          setCounter(counterData);
        }

        // Try to fetch rank from top 10 view
        try {
          const { data: topPostData } = await supabase
            .from("user_top10_posts")
            .select("rank")
            .eq("post_id", postId)
            .eq("creator_id", postData.creator_id)
            .single();

          if (topPostData) {
            setRank(topPostData.rank);
          }
        } catch (error) {
          // Ignore if view doesn't exist or post not in top 10
        }
      } catch (error) {
        console.error("Error fetching post data:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, supabase]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!post) {
    return notFound();
  }

  const creator = post.creator;
  const isHighlighted = rank !== null && rank <= 3;

  return (
    <div className="min-h-screen">
      <Header />
      <ProfileAnimatedBackground />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
        
        {/* Post Detail */}
        <div className="space-y-8 mt-6">
          {/* Main Post Card */}
          <PostCard
            postId={post.post_id}
            creatorId={post.creator_id}
            creatorName={creator?.full_name || "Unknown"}
            creatorUsername={creator?.username || "unknown"}
            creatorImage={creator?.profile_image || undefined}
            content={post.content}
            createdAt={post.created_at}
            isHighlighted={isHighlighted}
          />

          {/* Engagement Overview */}
          {counter && (
            <div className="grid grid-cols-3 gap-4">
              <div className={`rounded-lg border backdrop-blur-md p-4 text-center ${theme === "light" ? "border-amber-300 bg-white/70" : "border-slate-700/60 bg-slate-900/40"}`}>
                <p className={`text-2xl font-bold ${theme === "light" ? "text-amber-900" : "text-cyan-300"}`}>
                  {counter.total_reactions}
                </p>
                <p className={`text-xs mt-1 ${theme === "light" ? "text-amber-700" : "text-slate-400"}`}>Reactions</p>
              </div>
              <div className={`rounded-lg border backdrop-blur-md p-4 text-center ${theme === "light" ? "border-amber-300 bg-white/70" : "border-slate-700/60 bg-slate-900/40"}`}>
                <p className={`text-2xl font-bold ${theme === "light" ? "text-amber-900" : "text-cyan-300"}`}>
                  {counter.total_comments}
                </p>
                <p className={`text-xs mt-1 ${theme === "light" ? "text-amber-700" : "text-slate-400"}`}>Comments</p>
              </div>
              <div className={`rounded-lg border backdrop-blur-md p-4 text-center ${theme === "light" ? "border-amber-300 bg-white/70" : "border-slate-700/60 bg-slate-900/40"}`}>
                <p className={`text-2xl font-bold ${theme === "light" ? "text-amber-900" : "text-cyan-300"}`}>
                  {counter.total_shares}
                </p>
                <p className={`text-xs mt-1 ${theme === "light" ? "text-amber-700" : "text-slate-400"}`}>Shares</p>
              </div>
            </div>
          )}

          {/* Ranking Badge */}
          {rank && (
            <div
              className={`rounded-lg border backdrop-blur-md p-4 ${
                rank <= 3
                  ? theme === "light" ? "border-amber-300 bg-amber-100/60" : "border-cyan-500/50 bg-cyan-600/20"
                  : theme === "light" ? "border-amber-300 bg-white/70" : "border-slate-700/60 bg-slate-900/40"
              }`}
            >
              <p className={`text-center font-semibold ${rank <= 3 ? (theme === "light" ? "text-amber-900" : "text-cyan-200") : (theme === "light" ? "text-amber-900" : "text-slate-300")}`}>
                {rank === 1 && "🥇"}
                {rank === 2 && "🥈"}
                {rank === 3 && "🥉"}
                {rank > 3 && "🏆"} Ranked #{rank} Post for{" "}
                {creator?.full_name || "this user"}
              </p>
            </div>
          )}

          {/* Comments Section */}
          <div className={`rounded-lg border backdrop-blur-md p-6 ${theme === "light" ? "border-amber-300 bg-white/70" : "border-slate-700/60 bg-slate-900/40"}`}>
            <h2 className={`text-lg font-bold mb-6 ${theme === "light" ? "text-amber-950" : "text-cyan-100"}`}>Comments</h2>
            <CommentSection postId={post.post_id} maxDisplay={50} />
          </div>
        </div>
      </main>
    </div>
  );
}
