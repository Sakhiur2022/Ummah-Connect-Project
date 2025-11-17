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

type ChatBoxProps = {
  selectedUserId: string;
};

export default function ChatBox({ selectedUserId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // -------------------------------------------------
  // FETCH MESSAGE HISTORY (FIXED)
  // -------------------------------------------------
  const fetchMessages = useCallback(async () => {
    if (!user || !selectedUserId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('MESSAGES')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`
      )
      .order('sent_at', { ascending: true });

    if (error) console.error('Error fetching messages:', error);
    else setMessages(data || []);

    setLoading(false);
  }, [user, selectedUserId]);

  // -------------------------------------------------
  // SEND MESSAGE (works with optimistic UI)
  // -------------------------------------------------
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

  // -------------------------------------------------
  // AUTO SCROLL TO BOTTOM
  // -------------------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // -------------------------------------------------
  // REALTIME LISTENER (FIXED FILTER)
  // -------------------------------------------------
  useEffect(() => {
    fetchMessages();

    if (!user || !selectedUserId) return;

    const channel = supabase
      .channel(`messages:${user.id}:${selectedUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'MESSAGES',
          filter: `and(receiver_id.eq.${user.id},sender_id.eq.${selectedUserId})`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUserId, fetchMessages]);

  // -------------------------------------------------

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center text-gray-400">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-bold">Chat with {selectedUserId}</h3>
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
