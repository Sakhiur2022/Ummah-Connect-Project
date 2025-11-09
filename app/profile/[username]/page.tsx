import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileAnimatedBackground } from "@/components/background/profile-animated-background";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileContent } from "@/components/profile/profile-content";
import { ProfileFeed } from "@/components/profile/profile-feed";
import Header from "@/components/ui/header";

interface ProfilePageProps {
  params: {
    username: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Fetch user profile
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", params.username)
    .single();

  if (!user) {
    notFound();
  }

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="min-h-screen relative">
      <ProfileAnimatedBackground />
      <Header />
      {/* Content with glassmorphism */}
      <div className="relative z-10">
        <ProfileHeader user={user} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <ProfileFeed 
              userId={user.id} 
              userName={user.full_name}
              userImage={user.profile_image}
              isOwnProfile={isOwnProfile}
              currentUserId={currentUser?.id}
            />
          </div>
          
          {/* Sidebar Profile Content */}
          <div className="lg:col-span-1">
            <ProfileContent userId={user.id} username={params.username} />
          </div>
        </div>
      </div>
    </div>
  );
}
