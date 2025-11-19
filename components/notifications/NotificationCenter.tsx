"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, X, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Notification {
  notification_id: string;
  recipient_id: string;
  actor_id: string | null;
  verb: string;
  object_type: string | null;
  object_id: string | null;
  object_id_bigint: number | null;
  is_read: boolean;
  created_at: string;
  actor?: {
    full_name: string;
    username: string;
    profile_image?: string;
  };
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscription
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "NOTIFICATION",
        },
        async (payload) => {
          const newNotif = payload.new as Notification;
          
          // Fetch actor data for the new notification
          if (newNotif.actor_id) {
            const { data: actorData } = await supabase
              .from("users")
              .select("id, full_name, username, profile_image")
              .eq("id", newNotif.actor_id)
              .single();
            
            if (actorData) {
              newNotif.actor = actorData;
            }
          }
          
          // Add notification once (only if unread)
          if (!newNotif.is_read) {
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: notificationsData, error: notifError } = await supabase
        .from("NOTIFICATION")
        .select("*")
        .eq("recipient_id", user.id)
        .not("actor_id", "is", null)
        .neq("actor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (notifError) throw notifError;

      // Fetch actor data separately for each unique actor_id
      const actorIds = [...new Set(notificationsData?.map((n) => n.actor_id).filter(Boolean))];
      let actorsMap: Record<string, any> = {};

      if (actorIds.length > 0) {
        const { data: actorsData, error: actorsError } = await supabase
          .from("users")
          .select("id, full_name, username, profile_image")
          .in("id", actorIds);

        if (actorsError) {
          console.warn("Error fetching actor data:", actorsError);
        } else {
          actorsMap = Object.fromEntries(
            (actorsData || []).map((actor) => [actor.id, actor])
          );
        }
      }

      // Merge actor data into notifications
      const enrichedNotifications = (notificationsData || []).map((notif) => ({
        ...notif,
        actor: notif.actor_id ? actorsMap[notif.actor_id] : null,
      }));

      setNotifications(enrichedNotifications);

      const unread = enrichedNotifications.filter((n) => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from("NOTIFICATION")
        .update({ is_read: true })
        .eq("notification_id", notificationId);

      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleAcceptFriend = async (notificationId: string, actorId: string) => {
    try {
      setLoading(true);
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      console.log('Attempting to accept friend request from', actorId, 'to', user.id);
      
      // Try RPC first
      const { data, error } = await supabase.rpc('accept_friend_request', {
        p_sender_id: actorId,
        p_receiver_id: user.id
      });

      console.log('RPC response:', { data, error });
      if (error) {
        console.log('RPC not available, attempting direct update:', error.message);
        const { error: updateError } = await supabase
          .from("FRIEND_REQUEST")
          .update({ status: "accepted" })
          .match({ sender_id: actorId, receiver_id: user.id });

        if (updateError) {
          console.error("Error accepting friend request:", updateError.message, updateError.code, updateError.details);
          alert(`Failed to accept friend request: ${updateError.message}`);
          return;
        }
      }

      // Mark notification as read
      await markAsRead(notificationId);

      // Show success message
      alert("Friend request accepted!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert("Failed to accept friend request");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectFriend = async (notificationId: string, actorId: string) => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Delete friend request
      const { error } = await supabase
        .from("FRIEND_REQUEST")
        .delete()
        .eq("sender_id", actorId)
        .eq("receiver_id", user.id);

      if (error) throw error;

      // Mark notification as dismissed
      await supabase
        .from("NOTIFICATION")
        .update({ is_dismissed: true })
        .eq("notification_id", notificationId);

      setNotifications((prev) =>
        prev.filter((n) => n.notification_id !== notificationId)
      );

      alert("Friend request rejected!");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      alert("Failed to reject friend request");
    } finally {
      setLoading(false);
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    const actor = notification.actor;
    const actorName = actor?.full_name || "Someone";
    const actorUsername = actor?.username || "user";
    const postId = notification.object_id_bigint;
    
    const actorLink = (
      <Link
        href={`/profile/${actorUsername}`}
        className="font-semibold text-foreground hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {actorName}
      </Link>
    );

    const postLink = postId ? (
      <Link
        href={`/post/${postId}`}
        className="font-semibold text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        your post
      </Link>
    ) : (
      <span className="font-semibold">a post</span>
    );

    switch (notification.verb) {
      case "friend_request":
        return (
          <>
            {actorLink} sent you a friend request
          </>
        );
      case "comment":
        return (
          <>
            {actorLink} commented on {postLink}
          </>
        );
      case "react":
        return (
          <>
            {actorLink} reacted to {postLink}
          </>
        );
      case "share":
        return (
          <>
            {actorLink} shared {postLink}
          </>
        );
      case "reply":
        return (
          <>
            {actorLink} replied to your comment
          </>
        );
      default:
        return "New notification";
    }
  };

  return (
    <>
      {/* Mobile and Desktop Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-lg hover:bg-accent transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-12 w-96 max-h-96 bg-card border border-border rounded-xl shadow-lg overflow-y-auto z-50"
            >
              {/* Header */}
              <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex justify-between items-center">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-accent rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Notification List */}
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.notification_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-accent/50 transition-colors ${
                        !notif.is_read ? "bg-accent/20" : ""
                      }`}
                    >
                      {/* Friend Request Notification */}
                      {notif.verb === "friend_request" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            {notif.actor?.profile_image ? (
                              <img
                                src={notif.actor.profile_image}
                                alt={notif.actor?.full_name || "User"}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                {(notif.actor?.full_name || "U").charAt(0)}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/profile/${notif.actor?.username || "user"}`}
                                className="text-sm font-semibold text-foreground hover:underline truncate block"
                              >
                                {notif.actor?.full_name || "User"}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                Sent a friend request
                              </p>
                            </div>
                          </div>

                          {/* Accept/Reject Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleAcceptFriend(
                                  notif.notification_id,
                                  notif.actor_id || ""
                                )
                              }
                              disabled={loading}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                handleRejectFriend(
                                  notif.notification_id,
                                  notif.actor_id || ""
                                )
                              }
                              disabled={loading}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Other Notifications */}
                      {notif.verb !== "friend_request" && (
                        <button
                          onClick={() => markAsRead(notif.notification_id)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start gap-3">
                            {notif.actor?.profile_image ? (
                              <img
                                src={notif.actor.profile_image}
                                alt={notif.actor?.full_name || "User"}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                {(notif.actor?.full_name || "U").charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">
                                {getNotificationMessage(notif)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Sheet View (Optional - for smaller screens) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
