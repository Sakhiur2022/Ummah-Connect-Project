'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ChatList from '@/components/messenger/ChatList';
import ChatBox from '@/components/messenger/ChatBox';
import Header from '@/components/ui/header';

export default function MessengerPage() {
  const { user } = useAuth();
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);

  const handleSelectChat = (userId: string) => {
    setSelectedChatUserId(userId);
  };

  return (
    // Changed bg-gray-900 to bg-background and text-white to text-foreground
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />
      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar: Added border-border for theme consistency */}
        <div className="w-full md:w-1/3 border-r border-border overflow-y-auto">
          <ChatList onSelectChat={handleSelectChat} selectedUserId={selectedChatUserId} />
        </div>

        {/* Chat Area */}
        <div className="hidden md:flex md:w-2/3 flex-col bg-background">
          {selectedChatUserId ? (
            <ChatBox selectedUserId={selectedChatUserId} />
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-muted-foreground">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
