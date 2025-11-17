// ============================================
// FILE: app/dashboard/page.tsx
// ============================================
"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  Mail, 
  User, 
  Cake, 
  Calendar, 
  UserCircle, 
  LogOut, 
  BookOpen, // Replaced Collection
  AlertTriangle,
  Heart,
  MessageCircle,
  Share2,
  RefreshCw,
  Award,
  TrendingUp
} from 'lucide-react'
import { Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
} from 'chart.js'
import Header from '@/components/ui/header'
import { IslamicBackground } from '@/components/islamic-background'
import { ProfileAnimatedBackground } from '@/components/background/profile-animated-background'

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
)

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// TypeScript Interfaces
interface UserData {
  id: string // Changed from number to string
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
  users: PostUser | null // Fixed: Changed from optional to nullable
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

// Crescent Icon Component
const CrescentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C9.34 2 6.89 2.93 5 4.46C8.03 5.93 10 9.02 10 12.5C10 15.98 8.03 19.07 5 20.54C6.89 22.07 9.34 23 12 23C17.52 23 22 18.52 22 13C22 7.48 17.52 3 12 3V2Z" />
  </svg>
)

export default function Dashboard() {
  // const router = useRouter()
  // const [user, setUser] = useState<UserData | null>(null)
  // const [posts, setPosts] = useState<Post[]>([])
  // const [ibadahStats, setIbadahStats] = useState<IbadahStats>({
  //   prayers_completed: 0,
  //   dhikr_count: 0,
  //   tilawah_pages: 0,
  //   fasting_days: 0,
  //   total_points: 0
  // })
  // const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  // const [loading, setLoading] = useState(true)
  // const [postsLoading, setPostsLoading] = useState(false)
  // const [currentDate, setCurrentDate] = useState('')
  // const [error, setError] = useState<string | null>(null)

  // useEffect(() => {
  //   // Set current date
  //   const today = new Date()
  //   setCurrentDate(today.toLocaleDateString('en-US', { 
  //     weekday: 'long', 
  //     year: 'numeric', 
  //     month: 'long', 
  //     day: 'numeric' 
  //   }))

  //   // Check authentication and fetch data
  //   checkAuthAndFetchData()
  // }, [])

  // const checkAuthAndFetchData = async () => {
  //   try {
  //     setError(null)
  //     // Check if user is authenticated
  //     const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

  //     if (authError || !authUser) {
  //       router.push('/login')
  //       return
  //     }

  //     // Fetch user data
  //     const { data: userData, error: userError } = await supabase
  //       .from('users')
  //       .select('*')
  //       .eq('id', authUser.id)
  //       .single()

  //     if (userError) throw userError

  //     setUser(userData)

  //     // Fetch all dashboard data in parallel
  //     await Promise.all([
  //       fetchFriendsPosts(authUser.id),
  //       fetchIbadahStats(authUser.id),
  //       fetchLeaderboard()
  //     ])

  //   } catch (error) {
  //     console.error('Error fetching data:', error)
  //     setError('Failed to load dashboard data')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // const fetchIbadahStats = async (userId: string) => {
  //   try {
  //     // Fetch salah records
  //     const { data: salahData } = await supabase
  //       .from('salah_record')
  //       .select('*')
  //       .eq('user_id', userId)

  //     // Fetch dhikr records
  //     const { data: dhikrData } = await supabase
  //       .from('dhikr_record')
  //       .select('count')
  //       .eq('user_id', userId)

  //     // Fetch tilawah records
  //     const { data: tilawahData } = await supabase
  //       .from('tilawah_record')
  //       .select('pages_read')
  //       .eq('user_id', userId)

  //     // Fetch point log for total points
  //     const { data: pointData } = await supabase
  //       .from('point_log')
  //       .select('points')
  //       .eq('user_id', userId)

  //     const prayersCompleted = salahData?.length || 0
  //     const dhikrCount = dhikrData?.reduce((sum, record) => sum + (record.count || 0), 0) || 0
  //     const tilawahPages = tilawahData?.reduce((sum, record) => sum + (record.pages_read || 0), 0) || 0
  //     const totalPoints = pointData?.reduce((sum, record) => sum + (record.points || 0), 0) || 0

  //     // Count fasting days from ibadah_session
  //     const { data: fastingData } = await supabase
  //       .from('ibadah_session')
  //       .select('*')
  //       .eq('user_id', userId)
  //       .eq('type', 'fasting')

  //     const fastingDays = fastingData?.length || 0

  //     setIbadahStats({
  //       prayers_completed: prayersCompleted,
  //       dhikr_count: dhikrCount,
  //       tilawah_pages: tilawahPages,
  //       fasting_days: fastingDays,
  //       total_points: totalPoints
  //     })

  //   } catch (error) {
  //     console.error('Error fetching ibadah stats:', error)
  //   }
  // }

  // const fetchLeaderboard = async () => {
  //   try {
  //     // Get top 10 users by points
  //     const { data: leaderboardData, error } = await supabase
  //       .rpc('get_leaderboard', { limit_count: 10 })

  //     if (error) {
  //       // Fallback: manual query if RPC doesn't exist
  //       const { data: usersWithPoints } = await supabase
  //         .from('users')
  //         .select(`
  //           id,
  //           full_name,
  //           profile_photo
  //         `)
  //         .limit(10)

  //       if (usersWithPoints) {
  //         // Get points for each user
  //         const leaderboardWithPoints = await Promise.all(
  //           usersWithPoints.map(async (user, index) => {
  //             const { data: pointData } = await supabase
  //               .from('point_log')
  //               .select('points')
  //               .eq('user_id', user.id)

  //             const totalPoints = pointData?.reduce((sum, record) => sum + (record.points || 0), 0) || 0

  //             return {
  //               ...user,
  //               total_points: totalPoints,
  //               rank: index + 1
  //             }
  //           })
  //         )

  //         // Sort by points
  //         const sorted = leaderboardWithPoints.sort((a, b) => b.total_points - a.total_points)
  //         setLeaderboard(sorted.slice(0, 10))
  //       }
  //     } else {
  //       setLeaderboard(leaderboardData || [])
  //     }

  //   } catch (error) {
  //     console.error('Error fetching leaderboard:', error)
  //   }
  // }

  // const fetchFriendsPosts = async (userId: string) => {
  //   try {
  //     setPostsLoading(true)
  //     setError(null)

  //     // Get user's friends
  //     const { data: friends, error: friendsError } = await supabase
  //       .from('friends')
  //       .select('friend_id')
  //       .eq('user_id', userId)
  //       .eq('status', 'accepted')

  //     if (friendsError) throw friendsError

  //     const friendIds = friends?.map(f => f.friend_id) || []

  //     if (friendIds.length === 0) {
  //       setPosts([])
  //       setPostsLoading(false)
  //       return
  //     }

  //     // Fetch posts from friends with user info
  //     const { data: postsData, error: postsError } = await supabase
  //       .from('posts')
  //       .select(`
  //         id,
  //         content,
  //         creator_id,
  //         created_at,
  //         users!posts_creator_id_fkey (
  //           full_name,
  //           username,
  //           profile_photo
  //         )
  //       `)
  //       .in('creator_id', friendIds)
  //       .order('created_at', { ascending: false })
  //       .limit(20)

  //     if (postsError) throw postsError

  //     // Fetch likes and comments counts separately for each post
  //     const postsWithCounts = await Promise.all(
  //       (postsData || []).map(async (post) => {
  //         // Get likes count
  //         const { count: likesCount } = await supabase
  //           .from('post_reactions')
  //           .select('*', { count: 'exact', head: true })
  //           .eq('post_id', post.id)

  //         // Get comments count
  //         const { count: commentsCount } = await supabase
  //           .from('post_comments')
  //           .select('*', { count: 'exact', head: true })
  //           .eq('post_id', post.id)

  //         // Fix: Properly handle the users object (it's an array, take first element)
  //         const userInfo = Array.isArray(post.users) && post.users.length > 0 
  //           ? post.users[0] 
  //           : post.users

  //         return {
  //           id: post.id,
  //           content: post.content,
  //           creator_id: post.creator_id,
  //           created_at: post.created_at,
  //           users: userInfo as PostUser | null,
  //           likes_count: likesCount || 0,
  //           comments_count: commentsCount || 0
  //         }
  //       })
  //     )

  //     setPosts(postsWithCounts)

  //   } catch (error) {
  //     console.error('Error fetching posts:', error)
  //     setError('Failed to load posts')
  //     setPosts([])
  //   } finally {
  //     setPostsLoading(false)
  //   }
  // }

  // const calculateAge = (dob: string | null): number | null => {
  //   if (!dob) return null
  //   const birthDate = new Date(dob)
  //   const today = new Date()
  //   let age = today.getFullYear() - birthDate.getFullYear()
  //   const monthDiff = today.getMonth() - birthDate.getMonth()
  //   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
  //     age--
  //   }
  //   return age
  // }

  // const handleLogout = async () => {
  //   try {
  //     await supabase.auth.signOut()
  //     router.push('/login')
  //   } catch (error) {
  //     console.error('Logout error:', error)
  //   }
  // }

  // const handleGoToProfile = () => {
  //   if (user?.id) {
  //     router.push(`/profile/${user.id}`)
  //   }
  // }

  // const handleRefreshPosts = async () => {
  //   if (user?.id) {
  //     await fetchFriendsPosts(user.id)
  //   }
  // }

  // const formatRelativeTime = (dateString: string): string => {
  //   const date = new Date(dateString)
  //   const now = new Date()
  //   const diffMs = now.getTime() - date.getTime()
  //   const diffMins = Math.floor(diffMs / 60000)
  //   const diffHours = Math.floor(diffMs / 3600000)
  //   const diffDays = Math.floor(diffMs / 86400000)

  //   if (diffMins < 1) return 'Just now'
  //   if (diffMins < 60) return `${diffMins}m ago`
  //   if (diffHours < 24) return `${diffHours}h ago`
  //   if (diffDays < 7) return `${diffDays}d ago`
  //   return date.toLocaleDateString()
  // }

  // // Chart.js data for Ibadah Stats
  // const ibadahChartData = {
  //   labels: ['Prayers', 'Dhikr (x100)', 'Tilawah', 'Fasting'],
  //   datasets: [{
  //     label: 'Ibadah Progress',
  //     data: [
  //       ibadahStats.prayers_completed,
  //       Math.floor(ibadahStats.dhikr_count / 100),
  //       ibadahStats.tilawah_pages,
  //       ibadahStats.fasting_days
  //     ],
  //     backgroundColor: [
  //       'rgba(251, 191, 36, 0.8)',
  //       'rgba(34, 197, 94, 0.8)',
  //       'rgba(59, 130, 246, 0.8)',
  //       'rgba(168, 85, 247, 0.8)'
  //     ],
  //     borderColor: [
  //       'rgb(251, 191, 36)',
  //       'rgb(34, 197, 94)',
  //       'rgb(59, 130, 246)',
  //       'rgb(168, 85, 247)'
  //     ],
  //     borderWidth: 2
  //   }]
  // }

  // const chartOptions = {
  //   responsive: true,
  //   maintainAspectRatio: false,
  //   plugins: {
  //     legend: {
  //       position: 'bottom' as const,
  //       labels: {
  //         color: 'rgb(148, 163, 184)',
  //         font: { size: 12 }
  //       }
  //     }
  //   }
  // }

  // // Loading State
  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <motion.div
  //         className="flex flex-col items-center gap-4"
  //         initial={{ opacity: 0 }}
  //         animate={{ opacity: 1 }}
  //       >
  //         <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
  //         <p className="text-muted-foreground">Loading dashboard...</p>
  //       </motion.div>
  //     </div>
  //   )
  // }

  // // Not Authenticated
  // if (!user) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center p-4">
  //       <motion.div 
  //         className="max-w-md w-full"
  //         initial={{ opacity: 0, y: 20 }}
  //         animate={{ opacity: 1, y: 0 }}
  //       >
  //         <div className="bg-card border border-border rounded-xl p-8 text-center shadow-lg">
  //           <motion.div
  //             initial={{ scale: 0 }}
  //             animate={{ scale: 1 }}
  //             transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
  //           >
  //             <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
  //           </motion.div>
  //           <h3 className="text-2xl font-bold text-foreground mb-2">User not found</h3>
  //           <p className="text-muted-foreground mb-6">
  //             Please login to access your dashboard.
  //           </p>
  //           <motion.button
  //             onClick={() => router.push('/login')}
  //             className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
  //             whileHover={{ scale: 1.02 }}
  //             whileTap={{ scale: 0.98 }}
  //           >
  //             <LogOut className="w-5 h-5" />
  //             Login
  //           </motion.button>
  //         </div>
  //       </motion.div>
  //     </div>
  //   )
  // }

  // const age = calculateAge(user.date_of_birth)

  return (
    <>
      <Header/>
      <ProfileAnimatedBackground/>
      Saif Ahmed Bro pls fix this....
    </>
    
    // <div className="min-h-screen bg-background">
    //   Header with Islamic Pattern
    //   <div className="relative bg-gradient-to-r from-sidebar via-sidebar-accent to-sidebar overflow-hidden">
    //     <div 
    //       className="absolute inset-0 opacity-10"
    //       style={{
    //         backgroundImage: 'url(data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23fbbf24" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E)'
    //       }}
    //     />
    //     <div className="container mx-auto px-4 py-6 relative z-10">
    //       <motion.div 
    //         className="flex items-center justify-between"
    //         initial={{ opacity: 0, x: -20 }}
    //         animate={{ opacity: 1, x: 0 }}
    //       >
    //         <div className="flex items-center gap-3">
    //           <CrescentIcon className="w-8 h-8 text-sidebar-primary" />
    //           <h1 className="text-2xl font-bold text-sidebar-foreground">Ummah Connect</h1>
    //         </div>
            
    //         {/* User Profile Preview */}
    //         <motion.button
    //           onClick={handleGoToProfile}
    //           className="flex items-center gap-2 bg-sidebar-accent/50 hover:bg-sidebar-accent/70 px-4 py-2 rounded-lg transition-colors"
    //           whileHover={{ scale: 1.05 }}
    //           whileTap={{ scale: 0.95 }}
    //         >
    //           <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden">
    //             {user.profile_photo ? (
    //               <img src={user.profile_photo} alt={user.full_name} className="w-full h-full object-cover" />
    //             ) : (
    //               <div className="w-full h-full flex items-center justify-center text-primary-foreground font-bold text-sm">
    //                 {user.full_name.charAt(0)}
    //               </div>
    //             )}
    //           </div>
    //           <span className="text-sidebar-foreground font-medium hidden md:inline">{user.full_name}</span>
    //         </motion.button>
    //       </motion.div>
    //     </div>
    //   </div>

    //   <div className="container mx-auto px-4 py-8 max-w-7xl">
    //     {/* Error Alert */}
    //     <AnimatePresence>
    //       {error && (
    //         <motion.div
    //           initial={{ opacity: 0, y: -20 }}
    //           animate={{ opacity: 1, y: 0 }}
    //           exit={{ opacity: 0, y: -20 }}
    //           className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-6 flex items-center gap-2"
    //         >
    //           <AlertTriangle className="w-5 h-5" />
    //           <span>{error}</span>
    //         </motion.div>
    //       )}
    //     </AnimatePresence>

    //     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    //       {/* LEFT COLUMN - User Info & Ibadah Stats */}
    //       <div className="lg:col-span-1 space-y-6">
    //         {/* Welcome Card */}
    //         <motion.div 
    //           className="bg-card border border-border rounded-xl shadow-lg overflow-hidden"
    //           initial={{ opacity: 0, y: 20 }}
    //           animate={{ opacity: 1, y: 0 }}
    //           transition={{ delay: 0.1 }}
    //         >
    //           <div className="border-b border-border px-6 py-4">
    //             <h5 className="text-lg font-semibold text-foreground flex items-center gap-2">
    //               <Home className="w-5 h-5 text-primary" />
    //               Dashboard
    //             </h5>
    //           </div>
    //           <div className="p-6">
    //             <h1 className="text-2xl font-bold text-foreground mb-4">
    //               Welcome, {user.full_name}! 🌙
    //             </h1>
                
    //             <div className="space-y-3">
    //               <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
    //                 <Mail className="w-4 h-4 text-primary flex-shrink-0" />
    //                 <div className="min-w-0 flex-1">
    //                   <span className="text-xs text-muted-foreground block">Email:</span>
    //                   <span className="text-sm text-foreground font-medium truncate block">{user.email}</span>
    //                 </div>
    //               </div>

    //               {age !== null && (
    //                 <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
    //                   <Cake className="w-4 h-4 text-primary" />
    //                   <div>
    //                     <span className="text-xs text-muted-foreground block">Age:</span>
    //                     <span className="text-sm text-foreground font-medium">{age} years</span>
    //                   </div>
    //                 </div>
    //               )}

    //               <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
    //                 <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
    //                 <div className="min-w-0 flex-1">
    //                   <span className="text-xs text-muted-foreground block">Date:</span>
    //                   <span className="text-xs text-foreground font-medium">{currentDate}</span>
    //                 </div>
    //               </div>
    //             </div>

    //             <div className="flex gap-2 mt-4">
    //               <motion.button
    //                 onClick={handleGoToProfile}
    //                 className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
    //                 whileHover={{ scale: 1.02 }}
    //                 whileTap={{ scale: 0.98 }}
    //               >
    //                 <UserCircle className="w-4 h-4" />
    //                 Profile
    //               </motion.button>

    //               <motion.button
    //                 onClick={handleLogout}
    //                 className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
    //                 whileHover={{ scale: 1.02 }}
    //                 whileTap={{ scale: 0.98 }}
    //               >
    //                 <LogOut className="w-4 h-4" />
    //                 Logout
    //               </motion.button>
    //             </div>
    //           </div>
    //         </motion.div>

    //         {/* Ibadah Stats Card */}
    //         <motion.div 
    //           className="bg-card border border-border rounded-xl shadow-lg overflow-hidden"
    //           initial={{ opacity: 0, y: 20 }}
    //           animate={{ opacity: 1, y: 0 }}
    //           transition={{ delay: 0.2 }}
    //         >
    //           <div className="border-b border-border px-6 py-4">
    //             <h5 className="text-lg font-semibold text-foreground flex items-center gap-2">
    //               <Award className="w-5 h-5 text-primary" />
    //               My Ibadah Stats
    //             </h5>
    //           </div>
    //           <div className="p-6">
    //             <div className="h-64 mb-4">
    //               <Doughnut data={ibadahChartData} options={chartOptions} />
    //             </div>

    //             <div className="grid grid-cols-2 gap-3">
    //               <div className="bg-amber-500/10 p-3 rounded-lg text-center">
    //                 <div className="text-2xl font-bold text-amber-500">{ibadahStats.prayers_completed}</div>
    //                 <div className="text-xs text-muted-foreground">Prayers</div>
    //               </div>
    //               <div className="bg-green-500/10 p-3 rounded-lg text-center">
    //                 <div className="text-2xl font-bold text-green-500">{ibadahStats.dhikr_count}</div>
    //                 <div className="text-xs text-muted-foreground">Dhikr</div>
    //               </div>
    //               <div className="bg-blue-500/10 p-3 rounded-lg text-center">
    //                 <div className="text-2xl font-bold text-blue-500">{ibadahStats.tilawah_pages}</div>
    //                 <div className="text-xs text-muted-foreground">Pages</div>
    //               </div>
    //               <div className="bg-purple-500/10 p-3 rounded-lg text-center">
    //                 <div className="text-2xl font-bold text-purple-500">{ibadahStats.fasting_days}</div>
    //                 <div className="text-xs text-muted-foreground">Fasts</div>
    //               </div>
    //             </div>

    //             <div className="mt-4 p-3 bg-primary/10 rounded-lg text-center">
    //               <div className="text-3xl font-bold text-primary">{ibadahStats.total_points}</div>
    //               <div className="text-sm text-muted-foreground">Total Points</div>
    //             </div>
    //           </div>
    //         </motion.div>

    //         {/* Leaderboard */}
    //         <motion.div 
    //           className="bg-card border border-border rounded-xl shadow-lg overflow-hidden"
    //           initial={{ opacity: 0, y: 20 }}
    //           animate={{ opacity: 1, y: 0 }}
    //           transition={{ delay: 0.3 }}
    //         >
    //           <div className="border-b border-border px-6 py-4">
    //             <h5 className="text-lg font-semibold text-foreground flex items-center gap-2">
    //               <TrendingUp className="w-5 h-5 text-primary" />
    //               Leaderboard
    //             </h5>
    //           </div>
    //           <div className="p-6">
    //             {leaderboard.length === 0 ? (
    //               <p className="text-center text-muted-foreground text-sm">No data yet</p>
    //             ) : (
    //               <div className="space-y-2">
    //                 {leaderboard.map((leader, index) => (
    //                   <motion.div
    //                     key={leader.id}
    //                     className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg"
    //                     initial={{ opacity: 0, x: -20 }}
    //                     animate={{ opacity: 1, x: 0 }}
    //                     transition={{ delay: 0.4 + index * 0.05 }}
    //                   >
    //                     <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
    //                       index === 0 ? 'bg-amber-500 text-white' :
    //                       index === 1 ? 'bg-gray-400 text-white' :
    //                       index === 2 ? 'bg-orange-600 text-white' :
    //                       'bg-muted text-foreground'
    //                     }`}>
    //                       {index + 1}
    //                     </div>
    //                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden">
    //                       {leader.profile_photo ? (
    //                         <img src={leader.profile_photo} alt={leader.full_name} className="w-full h-full object-cover" />
    //                       ) : (
    //                         <div className="w-full h-full flex items-center justify-center text-primary-foreground font-bold text-sm">
    //                           {leader.full_name.charAt(0)}
    //                         </div>
    //                       )}
    //                     </div>
    //                     <div className="flex-1 min-w-0">
    //                       <p className="text-sm font-medium text-foreground truncate">{leader.full_name}</p>
    //                     </div>
    //                     <div className="text-sm font-bold text-primary">{leader.total_points}</div>
    //                   </motion.div>
    //                 ))}
    //               </div>
    //             )}
    //           </div>
    //         </motion.div>
    //       </div>

    //       {/* RIGHT COLUMN - Posts Feed */}
    //       <div className="lg:col-span-2">
    //         <motion.div 
    //           className="bg-card border border-border rounded-xl shadow-lg"
    //           initial={{ opacity: 0, y: 20 }}
    //           animate={{ opacity: 1, y: 0 }}
    //           transition={{ delay: 0.4 }}
    //         >
    //           <div className="border-b border-border px-6 py-4 flex items-center justify-between">
    //             <h5 className="text-lg font-semibold text-foreground flex items-center gap-2">
    //             </div>
) }