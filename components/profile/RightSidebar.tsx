"use client"

import FriendsList from "@/components/profile/FriendsList"
import FriendRequests from "@/components/profile/FriendRequests"
import PhotoGallery from "@/components/profile/PhotoGallery"

export default function RightSidebar({ userId }: { userId: string }) {
  return (
    <aside className="lg:w-1/3 w-full space-y-4 p-4 bg-card border rounded-lg">
      <FriendsList userId={userId} />
      <FriendRequests userId={userId} />
      <PhotoGallery userId={userId} />
    </aside>
  )
}
