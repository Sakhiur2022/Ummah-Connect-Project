'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useThemeSafe } from '@/lib/use-theme-safe'
import { motion } from 'framer-motion'
import { UserPlus, UserCheck, Clock, X } from 'lucide-react'

type Friend = {
  id: string
  full_name: string
  username: string
  profile_image: string | null
  mutualCount?: number
}

type FriendRequestStatus = 'not_friends' | 'pending_sent' | 'pending_received' | 'friends'

export default function FriendsList({ userId, currentUserId }: { userId: string; currentUserId?: string }) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [mutualFriends, setMutualFriends] = useState<Friend[]>([])
  const [mutualCount, setMutualCount] = useState(0)
  const [friendRequestStatus, setFriendRequestStatus] = useState<FriendRequestStatus>('not_friends')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const supabase = createClient()
  const { theme } = useThemeSafe()
  const isOwnProfile = userId === currentUserId

  // Fetch friends for the profile
  const fetchFriends = async () => {
    try {
      // Get friends where user is sender
      const { data: senderData, error: senderError } = await supabase
        .from('FRIEND_REQUEST')
        .select(`
          sender_id,
          receiver_id,
          status,
          sender:sender_id(id, full_name, username, profile_image),
          receiver:receiver_id(id, full_name, username, profile_image)
        `)
        .eq('sender_id', userId)
        .eq('status', 'accepted')

      // Get friends where user is receiver
      const { data: receiverData, error: receiverError } = await supabase
        .from('FRIEND_REQUEST')
        .select(`
          sender_id,
          receiver_id,
          status,
          sender:sender_id(id, full_name, username, profile_image),
          receiver:receiver_id(id, full_name, username, profile_image)
        `)
        .eq('receiver_id', userId)
        .eq('status', 'accepted')

      if (senderError) {
        console.error('Error fetching sender friends:', senderError)
      }
      if (receiverError) {
        console.error('Error fetching receiver friends:', receiverError)
      }

      const allData = [...(senderData || []), ...(receiverData || [])]
      const formatted = allData.map((row: any) => {
        const isSender = row.sender_id === userId
        const u = isSender ? row.receiver : row.sender
        return {
          id: u.id,
          full_name: u.full_name,
          username: u.username,
          profile_image: u.profile_image
        }
      })
      setFriends(formatted)
    } catch (err) {
      console.error('Error in fetchFriends:', err)
    }
  }

  // Fetch friend request status (only if viewing another user's profile)
  const fetchFriendRequestStatus = async () => {
    if (!currentUserId || isOwnProfile) return

    try {
      // Try to find request where current user is sender
      const { data: sentData } = await supabase
        .from('FRIEND_REQUEST')
        .select('status')
        .eq('sender_id', currentUserId)
        .eq('receiver_id', userId)
        .single()

      if (sentData) {
        if (sentData.status === 'accepted') {
          setFriendRequestStatus('friends')
        } else {
          setFriendRequestStatus('pending_sent')
        }
        return
      }

      // Try to find request where current user is receiver
      const { data: receivedData } = await supabase
        .from('FRIEND_REQUEST')
        .select('status')
        .eq('sender_id', userId)
        .eq('receiver_id', currentUserId)
        .single()

      if (receivedData) {
        if (receivedData.status === 'accepted') {
          setFriendRequestStatus('friends')
        } else {
          setFriendRequestStatus('pending_received')
        }
      } else {
        setFriendRequestStatus('not_friends')
      }
    } catch (err) {
      console.error('Error in fetchFriendRequestStatus:', err)
      setFriendRequestStatus('not_friends')
    }
  }

  // Fetch mutual friends
  const fetchMutualFriends = async () => {
    if (!currentUserId || isOwnProfile) return

    try {
      // Get current user's friends (as sender)
      const { data: currentUserFriendsSender } = await supabase
        .from('FRIEND_REQUEST')
        .select('sender_id, receiver_id')
        .eq('sender_id', currentUserId)
        .eq('status', 'accepted')

      // Get current user's friends (as receiver)
      const { data: currentUserFriendsReceiver } = await supabase
        .from('FRIEND_REQUEST')
        .select('sender_id, receiver_id')
        .eq('receiver_id', currentUserId)
        .eq('status', 'accepted')

      // Get profile user's friends (as sender)
      const { data: profileUserFriendsSender } = await supabase
        .from('FRIEND_REQUEST')
        .select('sender_id, receiver_id')
        .eq('sender_id', userId)
        .eq('status', 'accepted')

      // Get profile user's friends (as receiver)
      const { data: profileUserFriendsReceiver } = await supabase
        .from('FRIEND_REQUEST')
        .select('sender_id, receiver_id')
        .eq('receiver_id', userId)
        .eq('status', 'accepted')

      // Find mutual friend IDs
      const currentUserFriendIds = new Set<string>()
      ;[...((currentUserFriendsSender) || []), ...((currentUserFriendsReceiver) || [])].forEach((row: any) => {
        currentUserFriendIds.add(row.sender_id === currentUserId ? row.receiver_id : row.sender_id)
      })

      const mutual: string[] = []
      ;[...((profileUserFriendsSender) || []), ...((profileUserFriendsReceiver) || [])].forEach((row: any) => {
        const friendId = row.sender_id === userId ? row.receiver_id : row.sender_id
        if (currentUserFriendIds.has(friendId)) {
          mutual.push(friendId)
        }
      })

      setMutualCount(mutual.length)

      // Fetch mutual friend details (limit to 5)
      if (mutual.length > 0) {
        const { data: mutualData } = await supabase
          .from('users')
          .select('id, full_name, username, profile_image')
          .in('id', mutual.slice(0, 5))

        if (mutualData) {
          setMutualFriends(mutualData)
        }
      }
    } catch (err) {
      console.error('Error in fetchMutualFriends:', err)
    }
  }

  // Send friend request
  const sendFriendRequest = async () => {
    setActionLoading(true)
    try {
      const { error } = await supabase.from('FRIEND_REQUEST').insert({
        sender_id: currentUserId,
        receiver_id: userId,
        status: 'pending'
      })

      if (error) {
        console.error('Error sending friend request:', error.message, error.code, error)
        alert(`Failed to send friend request: ${error.message}`)
      } else {
        setFriendRequestStatus('pending_sent')
        alert('Friend request sent!')
      }
    } catch (err) {
      console.error('Error in sendFriendRequest:', err)
      alert('Failed to send friend request')
    } finally {
      setActionLoading(false)
    }
  }

  // Cancel friend request
  const cancelFriendRequest = async () => {
    setActionLoading(true)
    try {
      const { data, error } = await supabase.rpc('cancel_friend_request', {
        p_sender_id: currentUserId,
        p_receiver_id: userId
      })

      if (error) {
        console.log('RPC not available, attempting direct delete:', error.message)
        const { error: deleteError } = await supabase
          .from('FRIEND_REQUEST')
          .delete()
          .match({ sender_id: currentUserId, receiver_id: userId })

        if (deleteError) {
          console.error('Error canceling friend request:', deleteError)
        } else {
          setFriendRequestStatus('not_friends')
        }
      } else {
        setFriendRequestStatus('not_friends')
      }
    } catch (err) {
      console.error('Error in cancelFriendRequest:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Accept friend request
  const acceptFriendRequest = async () => {
    setActionLoading(true)
    try {
      console.log('Attempting to accept friend request from', userId, 'to', currentUserId)
      
      // Use RPC call instead of direct update to avoid RLS issues
      const { data, error } = await supabase.rpc('accept_friend_request', {
        p_sender_id: userId,
        p_receiver_id: currentUserId
      })

      console.log('RPC response:', { data, error })
      if (error) {
        // If RPC doesn't exist, fall back to direct update
        console.log('RPC not available, attempting direct update:', error.message)
        const { data: updateData, error: updateError } = await supabase
          .from('FRIEND_REQUEST')
          .update({ status: 'accepted' })
          .match({ sender_id: userId, receiver_id: currentUserId })
          .select()

        if (updateError) {
          console.error('Error accepting friend request:', updateError.message, updateError.code, updateError.details)
          alert(`Failed to accept friend request: ${updateError.message}`)
        } else {
          setFriendRequestStatus('friends')
          await fetchFriends()
          alert('Friend request accepted!')
        }
      } else {
        setFriendRequestStatus('friends')
        await fetchFriends()
        alert('Friend request accepted!')
      }
    } catch (err) {
      console.error('Error in acceptFriendRequest:', err)
      alert('Failed to accept friend request')
    } finally {
      setActionLoading(false)
    }
  }

  // Reject friend request
  const rejectFriendRequest = async () => {
    setActionLoading(true)
    try {
      const { data, error } = await supabase.rpc('reject_friend_request', {
        p_sender_id: userId,
        p_receiver_id: currentUserId
      })

      if (error) {
        console.log('RPC not available, attempting direct delete:', error.message)
        const { error: deleteError } = await supabase
          .from('FRIEND_REQUEST')
          .delete()
          .match({ sender_id: userId, receiver_id: currentUserId })

        if (deleteError) {
          console.error('Error rejecting friend request:', deleteError.message, deleteError.code, deleteError)
          alert(`Failed to reject friend request: ${deleteError.message}`)
        } else {
          setFriendRequestStatus('not_friends')
          alert('Friend request rejected!')
        }
      } else {
        setFriendRequestStatus('not_friends')
        alert('Friend request rejected!')
      }
    } catch (err) {
      console.error('Error in rejectFriendRequest:', err)
      alert('Failed to reject friend request')
    } finally {
      setActionLoading(false)
    }
  }

  // Remove friend
  const removeFriend = async () => {
    setActionLoading(true)
    try {
      // Try to find and update where current user is sender
      const { data: friendReq1, error: checkError1 } = await supabase
        .from('FRIEND_REQUEST')
        .select('sender_id, receiver_id')
        .match({ sender_id: currentUserId, receiver_id: userId, status: 'accepted' })
        .single()

      if (!checkError1 && friendReq1) {
        const { error } = await supabase
          .from('FRIEND_REQUEST')
          .update({ status: 'pending' })
          .match({ sender_id: friendReq1.sender_id, receiver_id: friendReq1.receiver_id })

        if (error) {
          console.error('Error removing friend:', error.message, error.code, error)
          alert(`Failed to remove friend: ${error.message}`)
        } else {
          setFriendRequestStatus('not_friends')
          await fetchFriends()
          alert('Friend removed!')
        }
        return
      }

      // Try to find and update where current user is receiver
      const { data: friendReq2, error: checkError2 } = await supabase
        .from('FRIEND_REQUEST')
        .select('sender_id, receiver_id')
        .match({ sender_id: userId, receiver_id: currentUserId, status: 'accepted' })
        .single()

      if (!checkError2 && friendReq2) {
        const { error } = await supabase
          .from('FRIEND_REQUEST')
          .update({ status: 'pending' })
          .match({ sender_id: friendReq2.sender_id, receiver_id: friendReq2.receiver_id })

        if (error) {
          console.error('Error removing friend:', error.message, error.code, error)
          alert(`Failed to remove friend: ${error.message}`)
        } else {
          setFriendRequestStatus('not_friends')
          await fetchFriends()
          alert('Friend removed!')
        }
        return
      }

      alert('Friend request not found')
    } catch (err) {
      console.error('Error in removeFriend:', err)
      alert('Failed to remove friend')
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchFriends()
      if (currentUserId && !isOwnProfile) {
        await fetchFriendRequestStatus()
        await fetchMutualFriends()
      }
      setLoading(false)
    }

    loadData()
  }, [userId, currentUserId])

  const bgClass = theme === 'light'
    ? 'bg-white border border-gray-200/60 shadow-lg shadow-gray-200/50'
    : 'bg-slate-900/40 border border-slate-700/60 shadow-lg shadow-black/50'

  const headingClass = theme === 'light'
    ? 'text-amber-900'
    : 'text-cyan-100'

  const textClass = theme === 'light'
    ? 'text-gray-600'
    : 'text-slate-300'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-6 backdrop-blur-md ${bgClass}`}
    >
      <div className="space-y-6">
        {/* Friend Request Button (only for other users) */}
        {!isOwnProfile && currentUserId && (
          <div className="flex gap-2">
            {friendRequestStatus === 'not_friends' && (
              <button
                onClick={sendFriendRequest}
                disabled={actionLoading}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition disabled:opacity-50 ${
                  theme === 'light'
                    ? 'bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg'
                    : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/50'
                }`}
              >
                <UserPlus size={18} />
                {actionLoading ? 'Sending...' : 'Add Friend'}
              </button>
            )}
            {friendRequestStatus === 'pending_sent' && (
              <>
                <button
                  onClick={cancelFriendRequest}
                  disabled={actionLoading}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition disabled:opacity-50 ${
                    theme === 'light'
                      ? 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                  }`}
                >
                  <Clock size={18} />
                  {actionLoading ? 'Canceling...' : 'Pending'}
                </button>
                <button
                  onClick={cancelFriendRequest}
                  disabled={actionLoading}
                  className="px-3 py-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive transition disabled:opacity-50"
                  title="Cancel request"
                >
                  <X size={18} />
                </button>
              </>
            )}
            {friendRequestStatus === 'pending_received' && (
              <>
                <button
                  onClick={acceptFriendRequest}
                  disabled={actionLoading}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition disabled:opacity-50 ${
                    theme === 'light'
                      ? 'bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg'
                      : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/50'
                  }`}
                >
                  <UserCheck size={18} />
                  {actionLoading ? 'Accepting...' : 'Accept'}
                </button>
                <button
                  onClick={rejectFriendRequest}
                  disabled={actionLoading}
                  className="px-3 py-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive transition disabled:opacity-50"
                  title="Reject request"
                >
                  <X size={18} />
                </button>
              </>
            )}
            {friendRequestStatus === 'friends' && (
              <button
                onClick={removeFriend}
                disabled={actionLoading}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition disabled:opacity-50 ${
                  theme === 'light'
                    ? 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                }`}
              >
                <UserCheck size={18} />
                {actionLoading ? 'Removing...' : 'Friends'}
              </button>
            )}
          </div>
        )}

        {/* Mutual Friends Count */}
        {!isOwnProfile && mutualCount > 0 && (
          <div className={`text-sm font-semibold ${textClass}`}>
            {mutualCount} mutual friend{mutualCount !== 1 ? 's' : ''}
          </div>
        )}

        {/* Mutual Friends Preview */}
        {mutualFriends.length > 0 && (
          <div>
            <h3 className={`font-semibold mb-3 ${headingClass}`}>Mutual Friends</h3>
            <div className="flex flex-wrap gap-2">
              {mutualFriends.map(f => (
                <motion.div
                  key={f.id}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-opacity-20 backdrop-blur-sm"
                  style={{
                    backgroundColor: theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)'
                  }}
                >
                  <img
                    src={f.profile_image || '/default-avatar.png'}
                    alt={f.full_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className={`text-sm font-medium ${headingClass}`}>{f.full_name}</span>
                </motion.div>
              ))}
              {mutualCount > 5 && (
                <div className={`text-sm font-medium ${textClass}`}>
                  +{mutualCount - 5} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <h2 className={`font-semibold text-lg mb-3 ${headingClass}`}>
            Friends {friends.length > 0 && <span className="text-sm">({friends.length})</span>}
          </h2>
          {!loading ? (
            friends.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {friends.map(f => (
                  <motion.div
                    key={f.id}
                    whileHover={{ scale: 1.03 }}
                    className="flex flex-col items-center text-center p-3 rounded-lg bg-opacity-20 backdrop-blur-sm cursor-pointer transition"
                    style={{
                      backgroundColor: theme === 'light' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(34, 197, 94, 0.05)',
                      border: `1px solid ${theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)'}`
                    }}
                  >
                    <img
                      src={f.profile_image || '/default-avatar.png'}
                      alt={f.full_name}
                      className="w-12 h-12 rounded-full object-cover mb-2"
                    />
                    <p className={`font-medium text-sm ${headingClass}`}>{f.full_name}</p>
                    <p className={`text-xs ${textClass}`}>@{f.username}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className={textClass}>No friends yet.</p>
            )
          ) : (
            <p className={textClass}>Loading friends...</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
