"use client";

import { useThemeSafe } from "@/lib/use-theme-safe";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, UserCheck, Clock, X } from "lucide-react";

interface ProfileHeaderProps {
  user: any;
}

type FriendRequestStatus = 'not_friends' | 'pending_sent' | 'pending_received' | 'friends'

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { theme } = useThemeSafe();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [friendRequestStatus, setFriendRequestStatus] = useState<FriendRequestStatus>('not_friends');
  const [actionLoading, setActionLoading] = useState(false);
  const [showUnfriendModal, setShowUnfriendModal] = useState(false);
  const supabase = createClient();

  const isOwnProfile = user.id === currentUserId;

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setCurrentUserId(authUser?.id);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUserId || isOwnProfile) return;

    const fetchFriendRequestStatus = async () => {
      try {
        // Try to find request where current user is sender
        const { data: sentData } = await supabase
          .from('FRIEND_REQUEST')
          .select('status')
          .eq('sender_id', currentUserId)
          .eq('receiver_id', user.id)
          .single();

        if (sentData) {
          if (sentData.status === 'accepted') {
            setFriendRequestStatus('friends');
          } else {
            setFriendRequestStatus('pending_sent');
          }
          return;
        }

        // Try to find request where current user is receiver
        const { data: receivedData } = await supabase
          .from('FRIEND_REQUEST')
          .select('status')
          .eq('sender_id', user.id)
          .eq('receiver_id', currentUserId)
          .single();

        if (receivedData) {
          if (receivedData.status === 'accepted') {
            setFriendRequestStatus('friends');
          } else {
            setFriendRequestStatus('pending_received');
          }
        } else {
          setFriendRequestStatus('not_friends');
        }
      } catch (err) {
        console.error('Error in fetchFriendRequestStatus:', err);
        setFriendRequestStatus('not_friends');
      }
    };

    fetchFriendRequestStatus();

    // Subscribe to real-time friend request status changes
    const friendRequestSubscription = supabase
      .channel('friend-request-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'FRIEND_REQUEST',
          filter: `or(and(sender_id=eq.${currentUserId},receiver_id=eq.${user.id}),and(sender_id=eq.${user.id},receiver_id=eq.${currentUserId}))`
        },
        () => {
          fetchFriendRequestStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendRequestSubscription);
    };
  }, [currentUserId, user.id, isOwnProfile]);

  const sendFriendRequest = async () => {
    if (!currentUserId) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('FRIEND_REQUEST').insert({
        sender_id: currentUserId,
        receiver_id: user.id,
        status: 'pending'
      });

      if (error) {
        console.error('Error sending friend request:', error.message, error.code, error);
        alert(`Failed to send friend request: ${error.message}`);
      } else {
        setFriendRequestStatus('pending_sent');
        alert('Friend request sent!');
      }
    } catch (err) {
      console.error('Error in sendFriendRequest:', err);
      alert('Failed to send friend request');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelFriendRequest = async () => {
    if (!currentUserId) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('cancel_friend_request', {
        p_sender_id: currentUserId,
        p_receiver_id: user.id
      });

      if (error) {
        console.log('RPC not available, attempting direct delete:', error.message);
        const { error: deleteError } = await supabase
          .from('FRIEND_REQUEST')
          .delete()
          .match({ sender_id: currentUserId, receiver_id: user.id });

        if (deleteError) {
          console.error('Error canceling friend request:', deleteError.message, deleteError.code, deleteError);
          alert(`Failed to cancel friend request: ${deleteError.message}`);
        } else {
          setFriendRequestStatus('not_friends');
          alert('Friend request canceled!');
        }
      } else {
        setFriendRequestStatus('not_friends');
        alert('Friend request canceled!');
      }
    } catch (err) {
      console.error('Error in cancelFriendRequest:', err);
      alert('Failed to cancel friend request');
    } finally {
      setActionLoading(false);
    }
  };
      
  const acceptFriendRequest = async () => {
    if (!currentUserId) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('accept_friend_request', {
        p_sender_id: user.id,
        p_receiver_id: currentUserId
      });

      if (error) {
        console.log('RPC not available, attempting direct update:', error.message);
        const { error: updateError } = await supabase
          .from('FRIEND_REQUEST')
          .update({ status: 'accepted' })
          .match({ sender_id: user.id, receiver_id: currentUserId });

        if (updateError) {
          console.error('Error accepting friend request:', updateError.message, updateError.code, updateError);
          alert(`Failed to accept friend request: ${updateError.message}`);
        } else {
          setFriendRequestStatus('friends');
          alert('Friend request accepted!');
        }
      } else {
        setFriendRequestStatus('friends');
        alert('Friend request accepted!');
      }
    } catch (err) {
      console.error('Error in acceptFriendRequest:', err);
      alert('Failed to accept friend request');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectFriendRequest = async () => {
    if (!currentUserId) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('reject_friend_request', {
        p_sender_id: user.id,
        p_receiver_id: currentUserId
      });

      if (error) {
        console.log('RPC not available, attempting direct delete:', error.message);
        const { error: deleteError } = await supabase
          .from('FRIEND_REQUEST')
          .delete()
          .match({ sender_id: user.id, receiver_id: currentUserId });

        if (deleteError) {
          console.error('Error rejecting friend request:', deleteError.message, deleteError.code, deleteError);
          alert(`Failed to reject friend request: ${deleteError.message}`);
        } else {
          setFriendRequestStatus('not_friends');
          alert('Friend request rejected!');
        }
      } else {
        setFriendRequestStatus('not_friends');
        alert('Friend request rejected!');
      }
    } catch (err) {
      console.error('Error in rejectFriendRequest:', err);
      alert('Failed to reject friend request');
    } finally {
      setActionLoading(false);
    }
  };

  const removeFriend = async () => {
    if (!currentUserId) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('remove_friend', {
        uid_a: currentUserId,
        uid_b: user.id
      });

      if (error) {
        console.error('Error removing friend via RPC:', error.message);
        alert(`Failed to remove friend: ${error.message}`);
      } else {
        setFriendRequestStatus('not_friends');
        setShowUnfriendModal(false);
        alert('Friend removed!');
      }
    } catch (err) {
      console.error('Error in removeFriend:', err);
      alert('Failed to remove friend');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`pt-32 pb-12 px-4 sm:px-6 lg:px-8 ${
        theme === "light"
          ? "bg-linear-to-b from-white/40 via-white/20 to-transparent backdrop-blur-md"
          : "bg-linear-to-b from-slate-900/40 via-slate-900/20 to-transparent backdrop-blur-md"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Banner section with background image preview */}
        <div
          className={`relative -mx-4 sm:-mx-6 lg:-mx-8 h-48 sm:h-64 rounded-b-2xl overflow-hidden backdrop-blur-sm mb-6 ${
            theme === "light"
              ? "bg-linear-to-br from-sky-300/30 to-amber-200/30"
              : "bg-linear-to-br from-cyan-900/30 to-purple-900/30"
          }`}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                theme === "light"
                  ? "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/profile-background-light.png-KOY6IR3SkVSAzUaxEkXrzyBnOuZOdx.jpeg)"
                  : "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/profile-background-dark-mode.png-gAaejDyGtvgILpA8Us9iiWkmTYtlc2.jpeg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </div>

        {/* Profile Info */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className={`relative -mt-24 sm:-mt-20 w-32 h-32 sm:w-40 sm:h-40 rounded-full ring-4 ${
              theme === "light"
                ? "ring-white/80 bg-linear-to-br from-amber-100 to-yellow-100"
                : "ring-slate-800/80 bg-linear-to-br from-cyan-900 to-purple-900"
            } flex items-center justify-center font-bold text-3xl ${
              theme === "light" ? "text-amber-900" : "text-cyan-300"
            } backdrop-blur-md shadow-2xl`}
          >
            {user.profile_image ? (
              <img
                src={user.profile_image || "/placeholder.svg"}
                alt={user.full_name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              user.full_name?.charAt(0) || "U"
            )}
          </motion.div>

          <div className="flex-1 mt-6 sm:mt-0 sm:mb-2">
            <h1
              className={`text-3xl sm:text-4xl font-bold mb-1 ${
                theme === "light" ? "text-amber-950" : "text-cyan-100"
              }`}
            >
              {user.full_name}
            </h1>
            <p
              className={`text-lg ${
                theme === "light" ? "text-amber-700/80" : "text-cyan-300/80"
              }`}
            >
              @{user.username}
            </p>
            {user.bio && (
              <p
                className={`mt-2 ${
                  theme === "light" ? "text-amber-900/70" : "text-slate-300"
                }`}
              >
                {user.bio}
              </p>
            )}
            
            {/* Friend Action Buttons */}
            {!isOwnProfile && currentUserId && (
              <div className="flex gap-2 mt-4">
                {friendRequestStatus === 'not_friends' && (
                  <button
                    onClick={sendFriendRequest}
                    disabled={actionLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
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
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
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
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
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
                    onClick={() => setShowUnfriendModal(true)}
                    disabled={actionLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
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
          </div>
        </div>
      </div>

      {/* Unfriend Confirmation Modal */}
      {showUnfriendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-xl p-6 max-w-sm w-full ${
              theme === "light"
                ? "bg-white border border-gray-200 shadow-lg"
                : "bg-slate-800 border border-slate-700 shadow-lg shadow-black/50"
            }`}
          >
            <h2 className={`text-xl font-bold mb-4 ${
              theme === "light" ? "text-gray-900" : "text-slate-100"
            }`}>
              Unfriend {user.full_name}?
            </h2>
        
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnfriendModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  theme === "light"
                    ? "bg-gray-200 hover:bg-gray-300 text-gray-900"
                    : "bg-slate-700 hover:bg-slate-600 text-slate-100"
                }`}
              >
                No
              </button>
              <button
                onClick={removeFriend}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
                  theme === "light"
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {actionLoading ? "Removing..." : "Yes, Unfriend"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
