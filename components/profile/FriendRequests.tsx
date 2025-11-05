"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type FriendRequest = {
  sender_id: string
  receiver_id: string
  status: string
  sent_at: string
  sender?: {
    username: string
    profile_image?: string
  }
}

export default function FriendRequests({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("FRIEND_REQUEST")
        .select(
          `
          sender_id,
          receiver_id,
          status,
          sent_at,
          sender:sender_id (
            username,
            profile_image
          )
          `
        )
        .eq("receiver_id", userId)
        .eq("status", "pending")

      if (error) console.error("Error fetching friend requests:", error)
      else {
        const formatted = Array.isArray(data)
          ? data.map((d: any) => ({
              sender_id: d.sender_id,
              receiver_id: d.receiver_id,
              status: d.status,
              sent_at: d.sent_at,
              // Supabase may return the joined "sender" as an array (when using a relation alias)
              sender: Array.isArray(d.sender) ? d.sender[0] : d.sender || undefined,
            }))
          : []
        setRequests(formatted)
      }
      setLoading(false)
    }

    fetchRequests()
  }, [userId, supabase])

  if (loading) {
    return (
      <div className="p-4 bg-card border rounded-lg">
        <p className="text-muted-foreground text-sm">Loading friend requests...</p>
      </div>
    )
  }

  if (!requests.length) {
    return (
      <div className="p-4 bg-card border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Friend Requests</h3>
        <p className="text-sm text-muted-foreground">No new friend requests.</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-card border rounded-lg space-y-3">
      <h3 className="text-lg font-semibold">Friend Requests</h3>
      <ul className="space-y-2">
        {requests.map((req) => (
          <li
            key={req.sender_id}
            className="flex items-center justify-between border-b border-border pb-2"
          >
            <div className="flex items-center space-x-3">
              {req.sender?.profile_image ? (
                <img
                  src={req.sender.profile_image}
                  alt={req.sender.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                  👤
                </div>
              )}
              <span className="text-sm font-medium">{req.sender?.username || "Unknown User"}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(req.sent_at).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
