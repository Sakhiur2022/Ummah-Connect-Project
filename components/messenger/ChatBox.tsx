'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Send } from 'lucide-react';

const supabase = createClient();

type Message = {
  id: string;
  content: string;
  sent_at: string;
  sender_id: string;
  receiver_id: string;
};

type UserInfo = {
  id: string;
  full_name: string;
  username: string;
  profile_image?: string;
};

type ChatBoxProps = {
  selectedUserId: string;
};

export default function ChatBox({ selectedUserId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatUser, setChatUser] = useState<UserInfo | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch chat user info
  useEffect(() => {
    if (!selectedUserId) return;

    const fetchUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, username, profile_image')
        .eq('id', selectedUserId)
        .single();

      if (error) console.error('Error fetching chat user:', error);
      else setChatUser(data);
    };

    fetchUser();
  }, [selectedUserId]);

  // Fetch message history
  const fetchMessages = useCallback(async () => {
    if (!user || !selectedUserId) return;

    const { data, error } = await supabase
      .from('MESSAGES')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`
      )
      .order('sent_at', { ascending: true });

    if (error) console.error('Error fetching messages:', error);
    else setMessages(data || []);
  }, [user, selectedUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription (ignore own messages to prevent duplicates)
  useEffect(() => {
    if (!user || !selectedUserId) return;

    const channel = supabase
      .channel(`chat:${user.id}:${selectedUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'MESSAGES' },
        (payload) => {
          const newMsg = payload.new as Message;

          // Ignore messages sent by current user
          if (
            newMsg.sender_id !== user.id &&
            ((newMsg.sender_id === selectedUserId && newMsg.receiver_id === user.id) ||
              (newMsg.sender_id === user.id && newMsg.receiver_id === selectedUserId))
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, selectedUserId]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const tempId = crypto.randomUUID();
    const messageToSend: Message = {
      id: tempId,
      sender_id: user.id,
      receiver_id: selectedUserId,
      content: newMessage.trim(),
      sent_at: new Date().toISOString(),
    };

    // Optimistic update
    setMessages((prev) => [...prev, messageToSend]);
    setNewMessage('');

    const { error } = await supabase.from('MESSAGES').insert({
      sender_id: messageToSend.sender_id,
      receiver_id: messageToSend.receiver_id,
      content: messageToSend.content,
    });

    if (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center space-x-3">
        <img
          src={chatUser?.profile_image || '/images/default-avatar.png'}
          alt={chatUser?.full_name}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => (e.currentTarget.src = 'https://placehold.co/40x40/333/FFF?text=E')}
        />
        <h3 className="font-bold">{chatUser?.full_name || 'Unknown User'}</h3>
      </div>

      {/* Messages */}
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-3 rounded-lg max-w-xs lg:max-w-md ${
                msg.sender_id === user?.id ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              <p>{msg.content}</p>
              <span className="text-xs text-gray-400 block text-right mt-1">
                {new Date(msg.sent_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="p-3 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
