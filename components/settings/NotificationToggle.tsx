'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, BellOff } from 'lucide-react';
import { useThemeSafe } from '@/lib/use-theme-safe';

export default function NotificationToggle() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const supabase = createClient();
  const { theme } = useThemeSafe();

  // Fetch current notification preference
  useEffect(() => {
    const fetchNotificationPreference = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error: fetchError } = await supabase
          .from('users')
          .select('notifications_enabled')
          .eq('id', user.id)
          .single();

        if (fetchError) throw fetchError;

        if (data) {
          setNotificationsEnabled(data.notifications_enabled ?? true);
        }
      } catch (err) {
        console.error('Error fetching notification preference:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationPreference();
  }, []);

  const handleToggle = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('No authenticated user');

      const newState = !notificationsEnabled;

      const { error: updateError } = await supabase
        .from('users')
        .update({ notifications_enabled: newState })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setNotificationsEnabled(newState);
      setMessage(
        newState
          ? '✓ Notifications enabled'
          : '✓ Notifications disabled'
      );

      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error('Error updating notification preference:', err);
      setError(err.message || 'Failed to update notification preference');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`rounded-lg p-6 border ${
        theme === 'light'
          ? 'bg-[oklch(0.96_0.02_60)] border-[oklch(0.9_0.03_60)]'
          : 'bg-[oklch(0.12_0.03_240)] border-[oklch(0.25_0.04_240)]'
      }`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-6 rounded ${theme === 'light' ? 'bg-[oklch(0.85_0.05_60)]' : 'bg-[oklch(0.18_0.04_240)]'}`} />
          <div className={`h-10 rounded ${theme === 'light' ? 'bg-[oklch(0.85_0.05_60)]' : 'bg-[oklch(0.18_0.04_240)]'}`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${
      theme === 'light'
        ? 'bg-[oklch(0.96_0.02_60)] border-[oklch(0.9_0.03_60)]'
        : 'bg-[oklch(0.12_0.03_240)] border-[oklch(0.25_0.04_240)]'
    }`}>
      {/* Header */}
      <div className={`p-6 border-b ${theme === 'light' ? 'border-[oklch(0.9_0.03_60)]' : 'border-[oklch(0.25_0.04_240)]'}`}>
        <div className="flex items-center gap-3 mb-2">
          {notificationsEnabled ? (
            <Bell className={`w-6 h-6 ${theme === 'light' ? 'text-[oklch(0.7_0.14_30)]' : 'text-[oklch(0.75_0.15_45)]'}`} />
          ) : (
            <BellOff className={`w-6 h-6 ${theme === 'light' ? 'text-[oklch(0.45_0.05_60)]' : 'text-[oklch(0.65_0.02_60)]'}`} />
          )}
          <h3 className={`text-lg font-semibold ${
            theme === 'light' ? 'text-[oklch(0.15_0.02_240)]' : 'text-[oklch(0.95_0.01_60)]'
          }`}>
            Notifications
          </h3>
        </div>
        <p className={`text-sm ${theme === 'light' ? 'text-[oklch(0.45_0.05_60)]' : 'text-[oklch(0.65_0.02_60)]'}`}>
          {notificationsEnabled
            ? 'You will receive notifications for friend requests, mahram requests, comments, and more'
            : 'All notifications are currently disabled'}
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
            notificationsEnabled
              ? theme === 'light'
                ? 'bg-[oklch(0.65_0.12_35)] hover:bg-[oklch(0.7_0.14_30)] text-[oklch(0.98_0.01_60)] disabled:opacity-50'
                : 'bg-[oklch(0.75_0.15_45)] hover:bg-[oklch(0.8_0.16_50)] text-[oklch(0.08_0.02_240)] disabled:opacity-50'
              : theme === 'light'
              ? 'bg-[oklch(0.85_0.05_60)] hover:bg-[oklch(0.8_0.04_60)] text-[oklch(0.15_0.02_240)] disabled:opacity-50'
              : 'bg-[oklch(0.18_0.04_240)] hover:bg-[oklch(0.22_0.05_240)] text-[oklch(0.95_0.01_60)] disabled:opacity-50'
          }`}
        >
          {loading ? 'Updating...' : notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
        </button>

        {/* Status Messages */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            theme === 'light'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-green-900/20 border border-green-700/50 text-green-300'
          }`}>
            {message}
          </div>
        )}
        {error && (
          <div className={`p-3 rounded-lg text-sm ${
            theme === 'light'
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-red-900/20 border border-red-700/50 text-red-300'
          }`}>
            {error}
          </div>
        )}

        {/* Info */}
        <p className={`text-xs ${theme === 'light' ? 'text-[oklch(0.45_0.05_60)]' : 'text-[oklch(0.65_0.02_60)]'}`}>
          {notificationsEnabled
            ? 'Click the button above to disable all notifications'
            : 'Click the button above to enable notifications again'}
        </p>
      </div>
    </div>
  );
}
