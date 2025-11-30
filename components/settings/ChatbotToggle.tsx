'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useThemeSafe } from '@/lib/use-theme-safe';
import { Bot } from 'lucide-react';

const STORAGE_KEY = 'uc_safety_popup_enabled';
const supabase = createClient();

export default function ChatbotToggle() {
  const { theme } = useThemeSafe();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('users')
          .select('safety_popup_enabled')
          .eq('id', user.id)
          .single();

        const val = data?.safety_popup_enabled;
        setEnabled(val ?? true);
        localStorage.setItem(STORAGE_KEY, String(val ?? true));
      } catch (err) {
        console.error('Failed to fetch Chatbot setting:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleToggle = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const newState = !enabled;

      const { error: updateError } = await supabase
        .from('users')
        .update({ safety_popup_enabled: newState })
        .eq('id', user.id);
      if (updateError) throw updateError;

      setEnabled(newState);
      localStorage.setItem(STORAGE_KEY, String(newState));
      setMessage(newState ? 'Chatbot enabled' : 'Chatbot disabled');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update Chatbot setting');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 rounded-lg animate-pulse">Loading...</div>;

  return (
    <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-white border-amber-300' : 'bg-slate-900 border-slate-700'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Bot className="w-5 h-5" /> Chatbot Popup
        </h3>
      </div>
      <p className="text-sm mb-3">
        {enabled ? 'Analyze Emotion popup is enabled globally' : 'Analyze Emotion popup is disabled'}
      </p>
      <button
        onClick={handleToggle}
        className={`w-full py-2 rounded-lg font-medium transition ${
          enabled ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        {enabled ? 'Disable Chatbot Popup' : 'Enable Chatbot Popup'}
      </button>
      {message && <p className="mt-2 text-sm text-green-500">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
