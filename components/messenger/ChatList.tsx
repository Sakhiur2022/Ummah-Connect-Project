'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useThemeSafe } from '@/lib/use-theme-safe';

const supabase = createClient();

type Conversation = {
  user_id: string;
  last_message_content: string;
  last_message_at: string;
  last_message_sender_id: string; // Add sender info
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
  const { theme } = useThemeSafe();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

      // Mark as unread if not selected and from other user
      if (otherUserId !== selectedUserId && newMsg.sender_id !== user.id) {
        setUnreadConversations((prev) => [...new Set([...prev, otherUserId])]);
      }
    },
    [user, selectedUserId]
  );

  // Real-time listener
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

    setIsSearching(true);

    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, profile_image')
      .ilike('username', `%${searchQuery}%`);

    if (error) console.error('Search error:', error);
    else setSearchResults(data || []);
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

  if (loading) return <div className={`p-4 ${theme === 'light' ? 'text-amber-900' : 'text-slate-400'}`}>Loading conversations...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className={`p-4 ${theme === 'light' ? 'border-amber-300 bg-white/50' : 'border-slate-700 bg-slate-900/50'} border-b`}>
        <h2 className={`text-xl font-bold mb-3 ${theme === 'light' ? 'text-amber-950' : 'text-cyan-100'}`}>Messages</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for users..."
            className={`flex-1 ${theme === 'light' ? 'bg-white border-amber-200 text-amber-950 placeholder-amber-400' : 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'} border rounded-lg p-2`}
          />
          <button
            onClick={handleSearch}
            className={`p-2 ${theme === 'light' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-cyan-600 hover:bg-cyan-500'} text-white rounded-lg`}
          >
            Search
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        {isSearching ? (
          <div>
            {searchResults.length === 0 ? (
              <p className={`p-4 ${theme === 'light' ? 'text-amber-900' : 'text-slate-400'}`}>No users found.</p>
            ) : (
              searchResults.map((userResult) => (
                <div
                  key={userResult.id}
                  onClick={() => handleSelectUserFromSearch(userResult.id)}
                  className={`flex items-center p-3 space-x-3 cursor-pointer ${theme === 'light' ? 'hover:bg-amber-100' : 'hover:bg-slate-700'}`}
                >
                  <img
                    src={userResult.profile_image || '/images/default-avatar.png'}
                    alt={userResult.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) =>
                      (e.currentTarget.src = 'https://placehold.co/48x48/333/FFF?text=E')
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${theme === 'light' ? 'text-amber-950' : 'text-white'}`}>{userResult.full_name}</p>
                    <p className={`text-sm truncate ${theme === 'light' ? 'text-amber-900/60' : 'text-slate-400'}`}>@{userResult.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            {conversations.length === 0 ? (
              <p className={`p-4 ${theme === 'light' ? 'text-amber-900' : 'text-slate-400'}`}>No conversations yet.</p>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.user_id}
                  onClick={() => handleSelectConversation(convo.user_id)}
                  className={`flex items-center p-3 space-x-3 cursor-pointer ${theme === 'light' ? 'hover:bg-amber-100' : 'hover:bg-slate-700'} ${
                    selectedUserId === convo.user_id ? (theme === 'light' ? 'bg-amber-200' : 'bg-slate-700/50') : ''
                  }`}
                >
                  <img
                    src={convo.profile_image || '/images/default-avatar.png'}
                    alt={convo.profile_full_name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) =>
                      (e.currentTarget.src = 'https://placehold.co/48x48/333/FFF?text=E')
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`truncate ${
                        unreadConversations.includes(convo.user_id) ? 'font-bold' : 'font-semibold'
                      } ${theme === 'light' ? 'text-amber-950' : 'text-white'}`}
                    >
                      {convo.profile_full_name}
                    </p>
                    <p className={`text-sm truncate ${theme === 'light' ? 'text-amber-900/60' : 'text-slate-400'}`}>
                      {convo.last_message_sender_id === user?.id
                        ? `You: ${convo.last_message_content}`
                        : convo.last_message_content}
                    </p>
                  </div>
                  <span className={`text-xs ${theme === 'light' ? 'text-amber-700' : 'text-slate-500'}`}>
                    {new Date(convo.last_message_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
