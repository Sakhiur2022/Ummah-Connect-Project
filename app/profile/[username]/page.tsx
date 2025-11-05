import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileAnimatedBackground } from "@/components/background/profile-animated-background";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileContent } from "@/components/profile/profile-content";

interface ProfilePageProps {
  params: {
    username: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = await createClient();

  // Fetch user profile
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", params.username)
    .single();

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen relative">
      <ProfileAnimatedBackground />

      {/* Content with glassmorphism */}
      <div className="relative z-10">
        <ProfileHeader user={user} />
        <ProfileContent userId={user.id} username={params.username} />
      </div>
    </div>
  );
}
