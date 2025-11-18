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

  // Debug logs to detect identity problems
  useEffect(() => {
    console.log('[ChatBox] current user:', user?.id);
    console.log('[ChatBox] selectedUserId:', selectedUserId);
  }, [user, selectedUserId]);

  // -------------------------------------------------
  // FETCH MESSAGE HISTORY
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

    if (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } else {
      setMessages((data as Message[]) || []);
    }

    setLoading(false);
  }, [user, selectedUserId]);

  // -------------------------------------------------
  // SEND MESSAGE (optimistic + reconcile)
  // -------------------------------------------------
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Defensive guards
    if (!user?.id) {
      console.error('[SendMessage] No authenticated user — aborting send.');
      return;
    }
    if (!selectedUserId) {
      console.error('[SendMessage] No selected user — aborting send.');
      return;
    }
    if (selectedUserId === user.id) {
      console.warn('[SendMessage] Attempt to send message to self (skipping).');
      return;
    }

    console.log('[SendMessage] sending as', user.id, 'to', selectedUserId, 'content:', newMessage);

    const tempId = crypto.randomUUID?.() ?? `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      sender_id: user.id,
      receiver_id: selectedUserId,
      content: newMessage.trim(),
      sent_at: new Date().toISOString(),
    };

    // Optimistic update
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage('');

    try {
      // Insert and request DB row(s) back to reconcile
      const { data: insertedRows, error } = await supabase
        .from('MESSAGES')
        .insert({
          sender_id: optimistic.sender_id,
          receiver_id: optimistic.receiver_id,
          content: optimistic.content,
        })
        .select('*');

      if (error) {
        console.error('Error sending message:', error);
        // roll back optimistic
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }

      const inserted = insertedRows?.[0] as Message | undefined;
      if (inserted) {
        // Replace optimistic with canonical DB row
        setMessages((prev) => prev.map((m) => (m.id === tempId ? inserted : m)));
      }
    } catch (err) {
      console.error('Unexpected error sending message:', err);
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
  // REALTIME LISTENER (listen BOTH directions)
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
          // listen to inserts where either (A->B) or (B->A)
          filter: `or(
            and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),
            and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})
          )`,
        },
        (payload) => {
          console.log('[Realtime] payload:', payload);
          const newMsg = payload.new as Message | undefined;
          if (!newMsg) return;

          // Defensive: ensure the message is between these two users
          const isRelated =
            (newMsg.sender_id === user.id && newMsg.receiver_id === selectedUserId) ||
            (newMsg.sender_id === selectedUserId && newMsg.receiver_id === user.id);
          if (!isRelated) {
            console.warn('[Realtime] Ignored unrelated message:', newMsg);
            return;
          }

          // Avoid adding duplicates if the message's id already exists
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
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
            aria-label="Type a message"
          />
          <button
            type="submit"
            className="p-3 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
