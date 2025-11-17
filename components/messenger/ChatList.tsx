'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const supabase = createClient();

type Conversation = {
  user_id: string;
  last_message_content: string;
  last_message_at: string;
  profile_full_name: string;
  profile_username: string;
  profile_image: string;
};

// This is the type for your Search
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
  
  // States for search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_conversations');

      if (error) {
        console.error('Error fetching conversations:', error);
      } else {
        setConversations(data || []);
      }
      setLoading(false);
    };

    fetchConversations();
  }, [user]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);

    const { data, error } = await supabase
      .from('users') // Your 'users' table is correct
      .select('id, username, full_name, profile_image')
      .ilike('username', `%${searchQuery}%`);

    if (error) {
      console.error('Search error:', error);
    } else {
      setSearchResults(data || []);
    }
  };

  // This function runs when you click a user from the search results
  const handleSelectUserFromSearch = (userId: string) => {
    onSelectChat(userId);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  if (loading) {
    return <div className="p-4 text-gray-400">Loading conversations...</div>;
  }

  return (
    <div className="flex flex-col">
      {/* Header & Search Bar */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold mb-3">Messages</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for users..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg p-2 text-white"
          />
          <button
            onClick={handleSearch}
            className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500"
          >
            Search
          </button>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-grow">
        {/*
          We show Search Results *if* the user is searching
          Otherwise, we show the Conversation List
        */}
        {isSearching ? (
          // --- SEARCH RESULTS ---
          <div>
            {searchResults.length === 0 ? (
              <p className="p-4 text-gray-400">No users found.</p>
            ) : (
              searchResults.map((userResult) => (
                <div
                  key={userResult.id}
                  onClick={() => handleSelectUserFromSearch(userResult.id)}
                  className="flex items-center p-3 space-x-3 cursor-pointer hover:bg-gray-700"
                >
                  <img
                    src={userResult.profile_image || '/images/default-avatar.png'}
                    alt={userResult.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/48x48/333/FFF?text=E')}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{userResult.full_name}</p>
                    <p className="text-sm text-gray-400 truncate">@{userResult.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // --- CONVERSATION LIST ---
          <div>
            {conversations.length === 0 ? (
              <p className="p-4 text-gray-400">No conversations yet.</p>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.user_id}
                  onClick={() => onSelectChat(convo.user_id)}
                  className={`flex items-center p-3 space-x-3 cursor-pointer hover:bg-gray-700 ${
                    selectedUserId === convo.user_id ? 'bg-gray-750' : ''
                  }`}
                >
                  <img
                    src={convo.profile_image || '/images/default-avatar.png'}
                    alt={convo.profile_full_name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/48x48/333/FFF?text=E')}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{convo.profile_full_name}</p>
                    <p className="text-sm text-gray-400 truncate">{convo.last_message_content}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(convo.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
