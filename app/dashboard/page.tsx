"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { 
  LogOut, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import Header from '@/components/ui/header'
import { ProfileAnimatedBackground } from '@/components/background/profile-animated-background'
import { Doughnut } from 'react-chartjs-2'

/* ---------------------- CHART.JS ---------------------- */
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

/* ---------------------- SUPABASE ---------------------- */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/* ---------------------- TYPES ---------------------- */
interface UserData {
  id: string
  full_name: string
  email: string
  date_of_birth: string | null
  gender: 'male' | 'female'
  profile_photo: string | null
  username?: string
}

interface PostUser {
  full_name: string
  username: string
  profile_photo: string | null
}

interface Post {
  id: string
  content: string
  creator_id: string
  created_at: string
users: PostUser | PostUser[] | null
  likes_count: number
  comments_count: number
}

interface IbadahStats {
  prayers_completed: number
  dhikr_count: number
  tilawah_pages: number
  fasting_days: number
  total_points: number
}

interface LeaderboardUser {
  id: string
  full_name: string
  profile_photo: string | null
  total_points: number
  rank: number
}

export default function Dashboard() {
  const router = useRouter()

  /* ---------------------- STATES ---------------------- */
  const [user, setUser] = useState<UserData | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [ibadahStats, setIbadahStats] = useState<IbadahStats>({
    prayers_completed: 0,
    dhikr_count: 0,
    tilawah_pages: 0,
    fasting_days: 0,
    total_points: 0
  })
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  /* ---------------------- INIT ---------------------- */
  useEffect(() => {
    const today = new Date()
    setCurrentDate(
      today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    )

    checkAuthAndFetchData()
  }, [])

  /* ---------------------- AUTH + FETCH ---------------------- */
  const checkAuthAndFetchData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) return router.push('/login')

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError) throw userError
      setUser(userData)

      // Fetch all dashboard data
      await Promise.all([
        fetchFriendsPosts(authUser.id),
        fetchIbadahStats(authUser.id),
        fetchLeaderboard()
      ])
    } catch (err) {
      console.error(err)
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  /* ---------------------- FETCH IBADAH ---------------------- */
  const fetchIbadahStats = async (userId: string) => {
    try {
      const { data: salahData } = await supabase
        .from('salah_record')
        .select('*')
        .eq('user_id', userId)

      const { data: dhikrData } = await supabase
        .from('dhikr_record')
        .select('count')
        .eq('user_id', userId)

      const { data: tilawahData } = await supabase
        .from('tilawah_record')
        .select('pages_read')
        .eq('user_id', userId)

      const { data: pointData } = await supabase
        .from('point_log')
        .select('points')
        .eq('user_id', userId)

      const { data: fastingData } = await supabase
        .from('ibadah_session')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'fasting')

      const prayersCompleted = salahData?.length || 0
      const dhikrCount = dhikrData?.reduce((s, r) => s + (r.count || 0), 0) || 0
      const tilawahPages = tilawahData?.reduce((s, r) => s + (r.pages_read || 0), 0) || 0
      const totalPoints = pointData?.reduce((s, r) => s + (r.points || 0), 0) || 0
      const fastingDays = fastingData?.length || 0

      setIbadahStats({
        prayers_completed: prayersCompleted,
        dhikr_count: dhikrCount,
        tilawah_pages: tilawahPages,
        fasting_days: fastingDays,
        total_points: totalPoints
      })
    } catch (err) {
      console.error('Error fetching ibadah stats:', err)
    }
  }

  /* ---------------------- FETCH LEADERBOARD ---------------------- */
  const fetchLeaderboard = async () => {
    try {
      const { data: rpcData, error } = await supabase.rpc('get_leaderboard', {
        limit_count: 10
      })

      if (!error && rpcData) {
        setLeaderboard(rpcData)
        return
      }

      // Fallback
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, profile_photo')
        .limit(10)

      if (!users) return

      const withPoints = await Promise.all(
        users.map(async (u, index) => {
          const { data: pts } = await supabase
            .from('point_log')
            .select('points')
            .eq('user_id', u.id)

          const total = pts?.reduce((s, r) => s + r.points, 0) || 0

          return { ...u, total_points: total, rank: index + 1 }
        })
      )

      setLeaderboard(withPoints.sort((a, b) => b.total_points - a.total_points))
    } catch (err) {
      console.error('Leaderboard Error:', err)
    }
  }

  /* ---------------------- FRIENDS POSTS ---------------------- */
  const fetchFriendsPosts = async (userId: string) => {
    try {
      setPostsLoading(true)
      const { data: friends } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted')

      const friendIds = friends?.map(f => f.friend_id) || []

      if (friendIds.length === 0) return setPosts([])

      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          creator_id,
          created_at,
          users!posts_creator_id_fkey (
            full_name,
            username,
            profile_photo
          )
        `)
        .in('creator_id', friendIds)
        .order('created_at', { ascending: false })
        .limit(20)

const postsWithCounts = await Promise.all(
  (postsData || []).map(async (post) => {
    // Normalize: always single user or null
    const userObj = Array.isArray(post.users)
      ? post.users[0] || null
      : post.users || null

    const { count: likesCount } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)

    const { count: commentsCount } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)

    return {
      id: post.id,
      content: post.content,
      creator_id: post.creator_id,
      created_at: post.created_at,
      users: userObj, // <-- always clean
      likes_count: likesCount || 0,
      comments_count: commentsCount || 0
    } as Post
  })
)


      setPosts(postsWithCounts)
    } catch (err) {
      console.error('Posts Error:', err)
      setError('Could not load posts.')
    } finally {
      setPostsLoading(false)
    }
  }

  /* ---------------------- AGE CALC ---------------------- */
  const calculateAge = (dob: string | null) => {
    if (!dob) return null
    const d = new Date(dob)
    const t = new Date()
    let age = t.getFullYear() - d.getFullYear()
    const m = t.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--
    return age
  }

  /* ---------------------- UI: LOADING ---------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  /* ---------------------- NOT AUTH ---------------------- */
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div 
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-lg">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">User not found</h3>
            <p className="text-muted-foreground mb-6">Please log in.</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-primary text-white py-3 rounded-lg"
            >
              Login
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const age = calculateAge(user.date_of_birth)

  /* ---------------------- FINAL UI ---------------------- */
  return (
    <>
      <Header />
      <ProfileAnimatedBackground />

      <div className="p-4 text-foreground">
        <h1 className="text-3xl font-bold">Welcome back, {user.full_name}</h1>
        <p className="text-muted-foreground">{currentDate}</p>

        <button
          className="mt-4 flex items-center gap-2 text-primary"
          onClick={() => fetchFriendsPosts(user.id)}
        >
          <RefreshCw size={16} />
          Refresh Posts
        </button>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">Ibadah Summary</h2>
            <Doughnut
              data={{
                labels: ['Prayers', 'Dhikr (x100)', 'Tilawah', 'Fasting'],
                datasets: [
                  {
                    data: [
                      ibadahStats.prayers_completed,
                      Math.floor(ibadahStats.dhikr_count / 100),
                      ibadahStats.tilawah_pages,
                      ibadahStats.fasting_days
                    ],
                    backgroundColor: [
                      'rgba(251, 191, 36, 0.8)',
                      'rgba(34, 197, 94, 0.8)',
                      'rgba(59, 130, 246, 0.8)',
                      'rgba(168, 85, 247, 0.8)'
                    ]
                  }
                ]
              }}
            />
          </div>

          <div className="bg-card p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
            <ul className="space-y-3">
              {leaderboard.map((u) => (
                <li key={u.id} className="flex justify-between">
                  <span>{u.rank}. {u.full_name}</span>
                  <span className="text-primary font-bold">{u.total_points} pts</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-3">Friends' Posts</h2>

          {postsLoading ? (
            <p className="text-muted-foreground">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground">No posts found.</p>
          ) : (
            <div className="space-y-4">
              {posts.map((p) => (
                <div key={p.id} className="bg-card p-4 rounded-xl shadow">
                   <div className="font-semibold">{(p.users as PostUser)?.full_name ?? 'Unknown User'}</div>
                  <p className="mt-2">{p.content}</p>
                  <div className="text-sm text-muted-foreground mt-2">
                    {p.likes_count} likes · {p.comments_count} comments
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
