'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

type Friend = {
  id: string
  full_name: string
  username: string
  profile_image: string | null
}

export default function FriendsList({ userId }: { userId: string }) {
  const [friends, setFriends] = useState<Friend[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchFriends = async () => {
      const { data, error } = await supabase
        .from('FRIEND_REQUEST')
        .select(`
          sender_id,
          receiver_id,
          status,
          sender:sender_id(full_name, username, profile_image),
          receiver:receiver_id(full_name, username, profile_image)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (error) {
        console.error('Error fetching friends:', error)
        return
      }

      const formatted = data!.map((row: any) => {
        const isSender = row.sender_id === userId
        const u = isSender ? row.receiver : row.sender
        return {
          id: isSender ? row.receiver_id : row.sender_id,
          full_name: u.full_name,
          username: u.username,
          profile_image: u.profile_image
        }
      })
      setFriends(formatted)
    }

    fetchFriends()
  }, [userId])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 rounded-2xl p-4 text-white shadow"
    >
      <h2 className="font-semibold text-lg mb-3">Friends</h2>
      {friends.length ? (
        <div className="space-y-3">
          {friends.map(f => (
            <motion.div
              key={f.id}
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-3"
            >
              <img
                src={f.profile_image || '/default-avatar.png'}
                alt={f.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium">{f.full_name}</p>
                <p className="text-gray-400 text-sm">@{f.username}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No friends yet.</p>
      )}
    </motion.div>
  )
}
