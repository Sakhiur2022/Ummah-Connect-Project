// app/dashboard/page.tsx
import React from "react";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/ui/header";
import { ProfileAnimatedBackground } from "@/components/background/profile-animated-background";
import { DashboardFeed } from "@/components/dashboard/dashboard-feed";

export default async function Page() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Fetch user profile details
  let userProfile = null;
  if (currentUser?.id) {
    const { data } = await supabase
      .from("users")
      .select("full_name, profile_image")
      .eq("id", currentUser.id)
      .single();
    userProfile = data;
  }

  return (
    <>
      <Header />
      <div>
        <ProfileAnimatedBackground />
      </div>
      <div className="relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <DashboardFeed 
            currentUserId={currentUser?.id} 
            currentUserName={userProfile?.full_name || currentUser?.email?.split("@")[0] || "User"}
            currentUserImage={userProfile?.profile_image || undefined}
          />
        </div>
      </div>
    </>
  );
}
