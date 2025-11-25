profile page


import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileAnimatedBackground } from "@/components/background/profile-animated-background";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileContent } from "@/components/profile/profile-content";
import { ProfileFeed } from "@/components/profile/profile-feed";
import Header from "@/components/ui/header";
import MahramAccessModal from "@/components/profile/mahram-access-modal";

// CHANGE: No curly braces around PhotoGallery
import PhotoGallery from "@/components/profile/PhotoGallery"; 

export const dynamic = "force-dynamic";

// ... keep the rest of the file exactly as it was ...

interface ProfilePageProps {
  params: {
    username: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = await createClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", params.username)
    .single();

  if (!user) notFound();

  const isOwnProfile = currentUser?.id === user.id;

  let hasAccess = true;
  let accessReason = "";
  
  if (!isOwnProfile && currentUser) {
    const { data: accessResult } = await supabase.rpc("can_view_profile", {
      p_viewer_id: currentUser.id,
      p_profile_owner_id: user.id,
    });

    if (accessResult && Array.isArray(accessResult) && accessResult.length > 0) {
      hasAccess = accessResult[0].can_view;
      accessReason = accessResult[0].reason;
    }
  }

  return (
    <div className="min-h-screen relative">
      <ProfileAnimatedBackground />
      <Header />
      <div className="relative z-10">
        {!hasAccess ? (
          <MahramAccessModal 
            profileOwnerId={user.id}
            currentUserId={currentUser?.id}
            profileOwnerName={user.full_name}
            reason={accessReason}
          />
        ) : (
          <>
            <ProfileHeader user={user} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Feed Column */}
              <div className="lg:col-span-2">
                <ProfileFeed 
                  userId={user.id} 
                  userName={user.full_name}
                  userImage={user.profile_image}
                  isOwnProfile={isOwnProfile}
                  currentUserId={currentUser?.id}
                />
              </div>
              
              {/* Sidebar Column */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                
                {/* Existing Sidebar Content (About, Stats, Friends) */}
                <ProfileContent userId={user.id} username={params.username} />
                
                {/* 2. Photo Gallery (Placed after other cards) */}
                <PhotoGallery userId={user.id} />
                
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
