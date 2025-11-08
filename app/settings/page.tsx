'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { useAuth } from '@/hooks/useAuth';
import { User } from '@supabase/supabase-js';

// Helper component for each setting card
const SettingsCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md">
    <div className="p-4 border-b border-gray-700">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

export default function SettingsPage() {
  const { user } = useAuth(); // Get the current user
  
  // States for forms
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // General loading/message states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // --- 1. Handle Username Update ---
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    // Updates the 'username' in the public 'users' table
    const { error } = await supabase
      .from('users') // Assumes your public table is 'users'
      .update({ username: newUsername })
      .eq('id', user.id);
    
    if (error) {
      setError('Username is already taken or invalid.');
    } else {
      setMessage('Username updated successfully!');
      setNewUsername(''); // Clear form
    }
    setLoading(false);
  };

  // --- 2. Handle Email Update ---
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setMessage('');

    // Uses Supabase's built-in secure flow to update auth email
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    
    if (error) {
      setError(error.message);
    } else {
      setMessage('Confirmation link sent to your new email. Please verify to complete the change.');
      setNewEmail(''); // Clear form
    }
    setLoading(false);
  };

  // --- 3. Handle Password Update ---
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Client-side validation
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Step A: Re-authenticate with current password to verify user
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email!, 
        password: currentPassword,
      });

      if (reauthError) {
        throw new Error('Current password is incorrect');
      }

      // Step B: If Step A succeeds, update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // --- Render Logic ---
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Account Settings</h1>

        {/* --- Form 1: Username --- */}
        <SettingsCard title="Change Username">
          <form onSubmit={handleUpdateUsername} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300">New Username</label>
              <input
                type="text"
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new username"
              />
            </div>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-gray-500">
              {loading ? 'Saving...' : 'Save Username'}
            </button>
          </form>
        </SettingsCard>

        {/* --- Form 2: Email --- */}
        <SettingsCard title="Change Email">
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">New Email</label>
              <input
                type="email"
                id="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new email"
              />
            </div>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-gray-500">
              {loading ? 'Sending...' : 'Update Email'}
            </button>
          </form>
        </SettingsCard>

        {/* --- Form 3: Password --- */}
        <SettingsCard title="Change Password">
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="New password (min. 6 chars)"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm new password"
              />
            </div>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-gray-500">
              {loading ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        </SettingsCard>

        {/* --- Message Area --- */}
        {message && <div className="p-3 rounded-md bg-green-600 text-white">{message}</div>}
        {error && <div className="p-3 rounded-md bg-red-600 text-white">{error}</div>}

      </div>
    </div>
  );
}
