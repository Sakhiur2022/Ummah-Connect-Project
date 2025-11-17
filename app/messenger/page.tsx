'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ChatList from '@/components/messenger/ChatList';
import ChatBox from '@/components/messenger/ChatBox';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

type UserResult = {
  id: string;
  username: string;
  full_name: string;
  profile_image?: string;
};

/**
 * Main page for the Messenger.
 * This component holds the state for which conversation is currently selected.
 */
export default function MessengerPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);

  const handleSelectChat = (userId: string) => {
    setSelectedChatUserId(userId);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, profile_image')
      .ilike('username', `%${searchQuery}%`);

    if (error) {
      console.error('Search error:', error);
    } else {
      setSearchResults(data || []);
    }
  };

  return (
    <div className="flex flex-col h-full">
      
      <div className="p-4 border-b border-gray-700">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full p-2 border rounded"
        />
        <button onClick={handleSearch} className="mt-2 p-2 bg-blue-500 text-white rounded">
          Search
        </button>
      </div>

      <div className="flex-grow p-4">
        {searchResults.length > 0 ? (
          searchResults.map((result) => (
            <div key={result.id} className="p-2 border-b">
              <p>{result.full_name} (@{result.username})</p>
              <button
                onClick={() => handleSelectChat(result.id)}
                className="text-blue-500 underline"
              >
                Message
              </button>
            </div>
          ))
        ) : (
          <p>No results found.</p>
        )}
      </div>

      <div className="flex h-[calc(100vh-80px)] bg-gray-900 text-white">
        <div className="w-full md:w-1/3 border-r border-gray-700 overflow-y-auto">
          <ChatList onSelectChat={handleSelectChat} selectedUserId={selectedChatUserId} />
        </div>

        <div className="hidden md:flex md:w-2/3 flex-col">
          {selectedChatUserId ? (
            <ChatBox selectedUserId={selectedChatUserId} />
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-gray-400">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
