'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const supabase = createClient();

type Conversation = {
  user_id: string;
  last_message_content: string;
  last_message_at: string;
  last_message_sender_id: string;
  profile_full_name: string;
  profile_username: string;
  profile_image: string;
};

type UserResult = {
  id: string;
  username: string;
  full_name: string;
  profile_image?: string;
};

type ChatListProps = {
  onSelectChat: (userId: string) => void;
  selectedUserId: string | null;
};

export default function ChatList({ onSelectChat, selectedUserId }: ChatListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Tracks IDs of users who sent a message while their chat wasn't open
  const [unreadConversations, setUnreadConversations] = useState<string[]>([]);

  // Fetch initial conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase.rpc('get_conversations');

    if (error) console.error('Error fetching conversations:', error);
    else setConversations(data || []);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Update conversation locally on new message
  const updateConversationList = useCallback(
    (newMsg: any) => {
      if (!user) return;

      const otherUserId = newMsg.sender_id === user.id ? newMsg.receiver_id : newMsg.sender_id;

      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.user_id === otherUserId);
        const updatedConversation: Conversation = {
          user_id: otherUserId,
          last_message_content: newMsg.content,
          last_message_at: newMsg.sent_at,
          last_message_sender_id: newMsg.sender_id,
          profile_full_name: prev[existingIndex]?.profile_full_name || 'Unknown',
          profile_username: prev[existingIndex]?.profile_username || 'unknown',
          profile_image: prev[existingIndex]?.profile_image || '/images/default-avatar.png',
        };

        if (existingIndex !== -1) {
          const newConversations = [...prev];
          newConversations.splice(existingIndex, 1);
          return [updatedConversation, ...newConversations];
        } else {
          return [updatedConversation, ...prev];
        }
      });

      // If the message is from someone else and we aren't looking at their chat, mark as unread
      if (otherUserId !== selectedUserId && newMsg.sender_id !== user.id) {
        setUnreadConversations((prev) => [...new Set([...prev, otherUserId])]);
      }
    },
    [user, selectedUserId]
  );

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`chatlist:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'MESSAGES' },
        (payload) => {
          updateConversationList(payload.new);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, updateConversationList]);

  // Search users
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    if (!user) return;

    setIsSearching(true);

    try {
      // Get current user's details
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('users')
        .select('gender')
        .eq('id', user.id)
        .single();

      if (currentUserError) throw currentUserError;

      // Search for users
      const { data: searchData, error: searchError } = await supabase
        .from('users')
        .select('id, username, full_name, profile_image, gender')
        .ilike('username', `%${searchQuery}%`);

      if (searchError) throw searchError;

      if (!searchData) {
        setSearchResults([]);
        return;
      }

      // Filter results based on gender rules
      let filteredResults = searchData.filter((searchUser: any) => {
        // Don't show self
        if (searchUser.id === user.id) return false;

        // If same gender, always show
        if (searchUser.gender === currentUserData.gender) return true;

        // If opposite gender, check if they are mahram
        // For now, only allow opposite gender if they are in the mahram list
        return false; // Default: don't show opposite gender
      });

      // For opposite gender users, check mahram relationship
      if (searchData.some((u: any) => u.gender !== currentUserData.gender)) {
        const oppositeGenderUsers = searchData.filter(
          (u: any) => u.gender !== currentUserData.gender && u.id !== user.id
        );

        const oppositeGenderUserIds = oppositeGenderUsers.map((u: any) => u.id);

        if (oppositeGenderUserIds.length > 0) {
          // Check MAHRAM table for relationships in both directions
          const { data: mahramData1, error: error1 } = await supabase
            .from('MAHRAM')
            .select('related_user_id')
            .eq('user_id', user.id)
            .in('related_user_id', oppositeGenderUserIds);

          const { data: mahramData2, error: error2 } = await supabase
            .from('MAHRAM')
            .select('user_id')
            .eq('related_user_id', user.id)
            .in('user_id', oppositeGenderUserIds);

          const mahramIds = new Set<string>();

          // Add mahrams where current user is the user_id
          if (!error1 && mahramData1) {
            mahramData1.forEach((m: any) => mahramIds.add(m.related_user_id));
          }

          // Add mahrams where current user is the related_user_id
          if (!error2 && mahramData2) {
            mahramData2.forEach((m: any) => mahramIds.add(m.user_id));
          }

          // Add mahram users to filtered results
          if (mahramIds.size > 0) {
            const mahramUsers = oppositeGenderUsers.filter((u: any) =>
              mahramIds.has(u.id)
            );

            filteredResults = [
              ...filteredResults,
              ...mahramUsers,
            ];
          }
        }
      }

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const handleSelectUserFromSearch = (userId: string) => {
    onSelectChat(userId);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setUnreadConversations((prev) => prev.filter((id) => id !== userId));
  };

  const handleSelectConversation = (userId: string) => {
    onSelectChat(userId);
    setUnreadConversations((prev) => prev.filter((id) => id !== userId));
  };

  if (loading) return <div className="p-4 text-muted-foreground">Loading conversations...</div>;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold mb-3 text-foreground">Messages</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for users..."
            className="flex-1 bg-muted/50 border border-input text-foreground placeholder-muted-foreground rounded-lg p-2 focus:ring-2 focus:ring-ring focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="p-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        {isSearching ? (
          <div>
            {searchResults.length === 0 ? (
              <p className="p-4 text-muted-foreground">No users found.</p>
            ) : (
              searchResults.map((userResult) => (
                <div
                  key={userResult.id}
                  onClick={() => handleSelectUserFromSearch(userResult.id)}
                  className="flex items-center p-3 space-x-3 cursor-pointer hover:bg-accent/50 transition-colors border-b border-border/40"
                >
                  <img
                    src={userResult.profile_image || '/images/default-avatar.png'}
                    alt={userResult.full_name}
                    className="w-12 h-12 rounded-full object-cover border border-border"
                    onError={(e) =>
                      (e.currentTarget.src = 'https://placehold.co/48x48/333/FFF?text=E')
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-foreground">{userResult.full_name}</p>
                    <p className="text-sm truncate text-muted-foreground">@{userResult.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            {conversations.length === 0 ? (
              <p className="p-4 text-muted-foreground">No conversations yet.</p>
            ) : (
              conversations.map((convo) => {
                const isUnread = unreadConversations.includes(convo.user_id);
                
                return (
                  <div
                    key={convo.user_id}
                    onClick={() => handleSelectConversation(convo.user_id)}
                    // Added 'group' to enable hover effects on children elements
                    className={`flex items-center p-3 space-x-3 cursor-pointer border-b border-border/40 transition-all group ${
                      selectedUserId === convo.user_id 
                        ? 'bg-accent border-l-4 border-l-primary' 
                        : 'hover:bg-accent/50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <img
                      src={convo.profile_image || '/images/default-avatar.png'}
                      alt={convo.profile_full_name}
                      className="w-12 h-12 rounded-full object-cover border border-border"
                      onError={(e) =>
                        (e.currentTarget.src = 'https://placehold.co/48x48/333/FFF?text=E')
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`truncate text-foreground ${
                          isUnread ? 'font-black' : 'font-semibold'
                        }`}
                      >
                        {convo.profile_full_name}
                      </p>
                      {/* Added 'group-hover:text-foreground' to ensure visibility on hover */}
                      <p 
                        className={`text-sm truncate transition-colors ${
                          isUnread 
                            ? 'font-bold text-foreground' 
                            : 'text-muted-foreground group-hover:text-foreground'
                        }`}
                      >
                        {convo.last_message_sender_id === user?.id
                          ? `You: ${convo.last_message_content}`
                          : convo.last_message_content}
                      </p>
                    </div>
                    {/* Added 'group-hover:text-foreground/70' for timestamp visibility */}
                    <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                      {new Date(convo.last_message_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
