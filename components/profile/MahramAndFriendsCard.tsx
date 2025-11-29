'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useThemeSafe } from '@/lib/use-theme-safe'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'

type MahramFriend = {
  id: string
  full_name: string
  username: string
  profile_image: string | null
}

export default function MahramAndFriendsCard({ userId, currentUserId }: { userId: string; currentUserId?: string }) {
  const router = useRouter()
  const [mahramFriends, setMahramFriends] = useState<MahramFriend[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { theme } = useThemeSafe()

  // Check if current user is a mahram of the profile owner
  useEffect(() => {
    const checkMahramAccess = async () => {
      if (!currentUserId) {
        setLoading(false)
        return
      }

      try {
        // Get all mahram pairs first
        const { data: mahramPairs } = await supabase
          .from('MAHRAM')
          .select('user_id, related_user_id')
          .eq('approved', true)

        // Check if viewing own profile
        const isOwnProfile = currentUserId === userId

        // Check if there's a mahram relationship between current user and profile owner (bidirectional)
        const isMahram = mahramPairs?.some(pair => 
          (pair.user_id === currentUserId && pair.related_user_id === userId) ||
          (pair.user_id === userId && pair.related_user_id === currentUserId)
        )

        // If not viewing own profile and current user is NOT a mahram of profile owner, don't show the card
        if (!isOwnProfile && !isMahram) {
          setLoading(false)
          return
        }

        // Get all mahrams of the profile owner
        const { data: mahramData } = await supabase
          .from('MAHRAM')
          .select('user_id, related_user_id')
          .eq('approved', true)

        if (!mahramData) {
          setLoading(false)
          return
        }

        // Extract mahram IDs
        const mahramIds = new Set<string>()
        mahramData.forEach((row: any) => {
          if (row.user_id === userId) {
            mahramIds.add(row.related_user_id)
          } else {
            mahramIds.add(row.user_id)
          }
        })

        // Get all friends of the profile owner
        const { data: friendsData } = await supabase
          .from('FRIEND_REQUEST')
          .select('sender_id, receiver_id')
          .eq('status', 'accepted')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

        if (!friendsData) {
          setLoading(false)
          return
        }

        // Extract friend IDs
        const friendIds = new Set<string>()
        friendsData.forEach((row: any) => {
          if (row.sender_id === userId) {
            friendIds.add(row.receiver_id)
          } else {
            friendIds.add(row.sender_id)
          }
        })

        // Find intersection (both mahram AND friend)
        const bothIds = Array.from(mahramIds).filter(id => friendIds.has(id))

        if (bothIds.length > 0) {
          // Fetch user details for mahram friends
          const { data: userData } = await supabase
            .from('users')
            .select('id, full_name, username, profile_image')
            .in('id', bothIds)

          if (userData) {
            setMahramFriends(userData)
          }
        }
      } catch (err) {
        console.error('Error fetching mahram friends:', err)
      } finally {
        setLoading(false)
      }
    }

    checkMahramAccess()
  }, [userId, currentUserId])

  const bgClass = theme === 'light'
    ? 'rounded-xl backdrop-blur-md border border-gray-200/60 bg-white/40 shadow-lg shadow-gray-200/50'
    : 'rounded-xl backdrop-blur-md border border-slate-700/60 bg-slate-900/40 shadow-lg shadow-black/50'

  const headingClass = theme === 'light'
    ? 'text-amber-900'
    : 'text-cyan-100'

  const textClass = theme === 'light'
    ? 'text-gray-600'
    : 'text-slate-300'

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 ${bgClass}`}
      >
        <div className="animate-pulse space-y-4">
          <div className={`h-8 rounded-lg ${theme === 'light' ? 'bg-gray-200/30' : 'bg-slate-700/30'}`} />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className={`h-24 rounded-lg ${theme === 'light' ? 'bg-gray-200/30' : 'bg-slate-700/30'}`} />
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  // Only show if there are mahram friends
  if (mahramFriends.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 ${bgClass}`}
    >
      <div className="space-y-6">
        <h2 className={`font-semibold text-lg mb-3 ${headingClass}`}>
          Mahrams & Friends {mahramFriends.length > 0 && <span className="text-sm">({mahramFriends.length})</span>}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {mahramFriends.map(f => (
            <motion.div
              key={f.id}
              whileHover={{ scale: 1.03 }}
              onClick={() => router.push(`/profile/${f.username}`)}
              className="flex flex-col items-center text-center p-3 rounded-lg bg-opacity-20 backdrop-blur-sm cursor-pointer transition"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(34, 197, 94, 0.05)',
                border: `1px solid ${theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)'}`
              }}
            >
              {f.profile_image ? (
                <img
                  src={f.profile_image}
                  alt={f.full_name}
                  className="w-12 h-12 rounded-full object-cover mb-2"
                />
              ) : (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${
                  theme === 'light'
                    ? 'bg-linear-to-br from-amber-100 to-yellow-100 text-amber-900'
                    : 'bg-linear-to-br from-cyan-900 to-purple-900 text-cyan-300'
                }`}>
                  {f.full_name?.charAt(0) || 'U'}
                </div>
              )}
              <p className={`font-medium text-sm ${headingClass}`}>{f.full_name}</p>
              <p className={`text-xs ${textClass}`}>@{f.username}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
