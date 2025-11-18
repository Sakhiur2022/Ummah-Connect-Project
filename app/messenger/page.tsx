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
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);

  const handleSelectChat = (userId: string) => {
    setSelectedChatUserId(userId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Messenger</h1>
        <p className="text-sm text-gray-400">Signed in as {user?.id ?? '—'}</p>
      </div>

      <div className="flex-grow p-4">
        <div className="flex h-[calc(100vh-120px)] bg-gray-900 text-white rounded-md overflow-hidden shadow">
          {/* Left: ChatList */}
          <div className="w-full md:w-1/3 border-r border-gray-700 overflow-y-auto">
            <ChatList onSelectChat={handleSelectChat} selectedUserId={selectedChatUserId} />
          </div>

          {/* Right: ChatBox */}
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
    </div>
  );
}
