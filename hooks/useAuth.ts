'use client'; 

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

// Import the Supabase client instance from your project's lib
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

/**
 * Custom React hook to get the current user and auth session.
 * Listens to Supabase auth state changes.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for an active session on component mount
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    
    getSession();

    // Set up a listener for auth state changes (e.g., SIGN_IN, SIGN_OUT)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Clean up the listener when the component unmounts
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); 

  // Expose the user object and loading state
  return { user, loading };
}