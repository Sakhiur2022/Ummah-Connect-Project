import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post/post-card";
import { CommentSection } from "@/components/post/comment-section";
import Header from "@/components/ui/header";

interface PostPageProps {
  params: {
    id: string;
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const supabase = await createClient();
  const postId = parseInt(params.id, 10);

  if (isNaN(postId)) {
    notFound();
  }

  // Fetch post
  const { data: post } = await supabase
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

  if (!post) {
    notFound();
  }

  // Fetch engagement data
  const { data: counter } = await supabase
    .from("POST_COUNTER")
    .select("total_reactions, total_comments, total_shares")
    .eq("post_id", postId)
    .single();

  // Try to fetch rank from top 10 view
  let rank = null;
  try {
    const { data: topPostData } = await supabase
      .from("user_top10_posts")
      .select("rank")
      .eq("post_id", postId)
      .eq("creator_id", post.creator_id)
      .single();

    if (topPostData) {
      rank = topPostData.rank;
    }
  } catch (error) {
    // Ignore if view doesn't exist or post not in top 10
  }

  const creator = Array.isArray(post.creator) ? post.creator[0] : post.creator;
  const isHighlighted = rank !== null && rank <= 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900">
      <Header />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Post Detail */}
        <div className="space-y-8">
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
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 backdrop-blur-md p-4 text-center">
                <p className="text-2xl font-bold text-cyan-300">
                  {counter.total_reactions}
                </p>
                <p className="text-xs text-slate-400 mt-1">Reactions</p>
              </div>
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 backdrop-blur-md p-4 text-center">
                <p className="text-2xl font-bold text-cyan-300">
                  {counter.total_comments}
                </p>
                <p className="text-xs text-slate-400 mt-1">Comments</p>
              </div>
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 backdrop-blur-md p-4 text-center">
                <p className="text-2xl font-bold text-cyan-300">
                  {counter.total_shares}
                </p>
                <p className="text-xs text-slate-400 mt-1">Shares</p>
              </div>
            </div>
          )}

          {/* Ranking Badge */}
          {rank && (
            <div
              className={`rounded-lg border backdrop-blur-md p-4 ${
                rank <= 3
                  ? "border-cyan-500/50 bg-cyan-600/20"
                  : "border-slate-700/60 bg-slate-900/40"
              }`}
            >
              <p className="text-center font-semibold text-cyan-200">
                {rank === 1 && "🥇"}
                {rank === 2 && "🥈"}
                {rank === 3 && "🥉"}
                {rank > 3 && "🏆"} Ranked #{rank} Post for{" "}
                {creator?.full_name || "this user"}
              </p>
            </div>
          )}

          {/* Comments Section */}
          <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 backdrop-blur-md p-6">
            <h2 className="text-lg font-bold text-cyan-100 mb-6">Comments</h2>
            <CommentSection postId={post.post_id} maxDisplay={50} />
          </div>
        </div>
      </main>
    </div>
  );
}
