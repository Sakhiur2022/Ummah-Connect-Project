'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useThemeSafe } from '@/lib/use-theme-safe'
import { motion } from 'framer-motion'
import { Users, Shield } from 'lucide-react'

type Mahram = {
  id: string
  full_name: string
  username: string
  profile_image: string | null
  relation_type: string
}

export default function MahramList({ userId, currentUserId }: { userId: string; currentUserId?: string }) {
  const router = useRouter()
  const [mahrams, setMahrams] = useState<Mahram[]>([])
  const [loading, setLoading] = useState(true)
  const [isUserMahram, setIsUserMahram] = useState(false)
  const supabase = createClient()
  const { theme } = useThemeSafe()

  // Check if current user is a mahram of the profile owner
  useEffect(() => {
    const checkIfMahram = async () => {
      if (!currentUserId || currentUserId === userId) {
        setIsUserMahram(false)
        return
      }

      try {
        // Check if current user is mahram with profile owner
        const { data } = await supabase
          .from('MAHRAM')
          .select('mahram_id')
          .eq('approved', true)
          .or(`and(user_id.eq.${currentUserId},related_user_id.eq.${userId}),and(user_id.eq.${userId},related_user_id.eq.${currentUserId})`)
          .single()

        setIsUserMahram(!!data)
      } catch (err) {
        setIsUserMahram(false)
      }
    }

    checkIfMahram()
  }, [currentUserId, userId])

  // Fetch mahrams for the profile owner (only if viewer is mahram or viewing own profile)
  const fetchMahrams = async () => {
    if (!isUserMahram && currentUserId !== userId) {
      setLoading(false)
      return
    }

    try {
      // Get mahrams where user is requester
      const { data: requesterData } = await supabase
        .from('MAHRAM')
        .select(`
          mahram_id,
          user_id,
          related_user_id,
          approved,
          relation_id,
          related_user:related_user_id(id, full_name, username, profile_image)
        `)
        .eq('user_id', userId)
        .eq('approved', true)

      // Get mahrams where user is the target
      const { data: targetData } = await supabase
        .from('MAHRAM')
        .select(`
          mahram_id,
          user_id,
          related_user_id,
          approved,
          relation_id,
          user:user_id(id, full_name, username, profile_image)
        `)
        .eq('related_user_id', userId)
        .eq('approved', true)

      const allMahrams: Mahram[] = []

      // Process requester mahrams (user_id is the profile owner)
      if (requesterData) {
        requesterData.forEach((row: any) => {
          if (row.related_user) {
            allMahrams.push({
              id: row.related_user.id,
              full_name: row.related_user.full_name,
              username: row.related_user.username,
              profile_image: row.related_user.profile_image,
              relation_type: getRelationType(row.relation_id, false),
            })
          }
        })
      }

      // Process target mahrams (related_user_id is the profile owner)
      if (targetData) {
        targetData.forEach((row: any) => {
          if (row.user) {
            allMahrams.push({
              id: row.user.id,
              full_name: row.user.full_name,
              username: row.user.username,
              profile_image: row.user.profile_image,
              relation_type: getRelationType(row.relation_id, true),
            })
          }
        })
      }

      // Remove duplicates
      const uniqueMahrams = Array.from(
        new Map(allMahrams.map((m) => [m.id, m])).values()
      )

      setMahrams(uniqueMahrams)
    } catch (err) {
      console.error('Error fetching mahrams:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRelationType = (relationId: number | null, isReverse: boolean) => {
    const relations: Record<number, { direct: string; reverse: string }> = {
      1: { direct: 'Mother', reverse: 'Son' },
      2: { direct: 'Father', reverse: 'Daughter' },
      3: { direct: 'Sister', reverse: 'Brother' },
      4: { direct: 'Brother', reverse: 'Sister' },
      5: { direct: 'Grandmother', reverse: 'Grandson' },
      6: { direct: 'Grandfather', reverse: 'Granddaughter' },
      7: { direct: 'Aunt', reverse: 'Nephew' },
      8: { direct: 'Uncle', reverse: 'Niece' },
      9: { direct: 'Niece', reverse: 'Uncle' },
      10: { direct: 'Nephew', reverse: 'Aunt' },
      11: { direct: 'Spouse', reverse: 'Spouse' },
    }
    const relation = relations[relationId || 0]
    if (!relation) return 'Mahram'
    return isReverse ? relation.reverse : relation.direct
  }

  useEffect(() => {
    fetchMahrams()

    const mahramSubscription = supabase
      .channel('mahrams-list-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'MAHRAM',
          filter: `or(and(user_id=eq.${userId},approved=eq.true),and(related_user_id=eq.${userId},approved=eq.true))`,
        },
        () => {
          fetchMahrams()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(mahramSubscription)
    }
  }, [userId, isUserMahram, currentUserId])

  // Only show if user is mahram or viewing own profile
  if (!isUserMahram && currentUserId !== userId) {
    return null
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl backdrop-blur-md p-6 border ${
          theme === 'light'
            ? 'bg-[oklch(0.96_0.02_60)] border-[oklch(0.9_0.03_60)]'
            : 'bg-[oklch(0.12_0.03_240)] border-[oklch(0.25_0.04_240)]'
        }`}
      >
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-16 rounded-lg animate-pulse ${
                theme === 'light' ? 'bg-[oklch(0.85_0.05_60)]' : 'bg-[oklch(0.15_0.03_240)]'
              }`}
            />
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl backdrop-blur-md p-6 border ${
        theme === 'light'
          ? 'bg-[oklch(0.96_0.02_60)] border-[oklch(0.9_0.03_60)]'
          : 'bg-[oklch(0.12_0.03_240)] border-[oklch(0.25_0.04_240)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield className={`w-6 h-6 ${theme === 'light' ? 'text-[oklch(0.7_0.14_30)]' : 'text-[oklch(0.75_0.15_45)]'}`} />
        <h3
          className={`text-lg font-semibold ${
            theme === 'light' ? 'text-[oklch(0.15_0.02_240)]' : 'text-[oklch(0.95_0.01_60)]'
          }`}
        >
          Mahrams
        </h3>
        <span
          className={`ml-auto px-2 py-1 rounded-full text-sm font-medium ${
            theme === 'light'
              ? 'bg-[oklch(0.85_0.05_60)] text-[oklch(0.7_0.14_30)]'
              : 'bg-[oklch(0.18_0.04_240)] text-[oklch(0.75_0.15_45)]'
          }`}
        >
          {mahrams.length}
        </span>
      </div>

      {/* Mahram List */}
      {mahrams.length === 0 ? (
        <div
          className={`text-center py-8 ${
            theme === 'light' ? 'text-[oklch(0.45_0.05_60)]' : 'text-[oklch(0.65_0.02_60)]'
          }`}
        >
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {currentUserId === userId
              ? 'No mahrams yet'
              : 'This user has no mahrams'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 mahram-scrollbar max-h-96 overflow-y-auto pr-2">
          {mahrams.map((mahram) => (
            <motion.button
              key={mahram.id}
              whileHover={{ x: 4 }}
              onClick={() => router.push(`/profile/${mahram.username}`)}
              className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all ${
                theme === 'light'
                  ? 'hover:bg-[oklch(0.85_0.05_60)] text-[oklch(0.15_0.02_240)]'
                  : 'hover:bg-[oklch(0.18_0.04_240)] text-[oklch(0.95_0.01_60)]'
              }`}
            >
              {/* Avatar */}
              {mahram.profile_image ? (
                <img
                  src={mahram.profile_image}
                  alt={mahram.full_name}
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
              ) : (
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold ${
                    theme === 'light'
                      ? 'bg-[oklch(0.85_0.05_60)] text-[oklch(0.7_0.14_30)]'
                      : 'bg-[oklch(0.18_0.04_240)] text-[oklch(0.75_0.15_45)]'
                  }`}
                >
                  {mahram.full_name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold truncate">{mahram.full_name}</p>
                <p
                  className={`text-sm truncate ${
                    theme === 'light' ? 'text-[oklch(0.45_0.05_60)]' : 'text-[oklch(0.65_0.02_60)]'
                  }`}
                >
                  @{mahram.username}
                </p>
              </div>

              {/* Relation Type Badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  theme === 'light'
                    ? 'bg-[oklch(0.75_0.1_45)] text-[oklch(0.15_0.02_240)]'
                    : 'bg-[oklch(0.18_0.04_240)] text-[oklch(0.75_0.15_45)]'
                }`}
              >
                {mahram.relation_type}
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
