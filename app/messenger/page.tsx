'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ChatList from '@/components/messenger/ChatList';
import ChatBox from '@/components/messenger/ChatBox';
import Header from '@/components/ui/header';
// We don't need supabase client here anymore since we aren't searching in this file
// import { createClient } from '@/lib/supabase/client'; 

/**
 * Main page for the Messenger.
 * CLEANED VERSION: Top search bar removed.
 */
export default function MessengerPage() {
  const { user } = useAuth();
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);

  const handleSelectChat = (userId: string) => {
    setSelectedChatUserId(userId);
  };

  return (
    // Changed h-full to h-screen to ensure it takes the full viewport height
    <div className="flex flex-col h-screen bg-gray-900 text-white">
     <Header/> 
      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 border-r border-gray-700 overflow-y-auto">
          <ChatList onSelectChat={handleSelectChat} selectedUserId={selectedChatUserId} />
        </div>

        {/* Chat Area */}
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
