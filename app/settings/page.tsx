settings page

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/ui/header';
import NotificationToggle from '@/components/settings/NotificationToggle';
import { Camera, Save, Loader2 } from 'lucide-react'; // Added icons for better UI

// Reusable Input Component for consistency
const SettingsInput = ({ label, ...props }: any) => (
  <div className="space-y-2">
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground/90">
      {label}
    </label>
    <input
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
      {...props}
    />
  </div>
);

// Reusable Card Component
const SettingsCard = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
    <div className="flex flex-col space-y-1.5 p-6 border-b border-border/40">
      <h3 className="text-2xl font-semibold leading-none tracking-tight">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    <div className="p-6 pt-6">
      {children}
    </div>
  </div>
);

// Reusable Button
const Button = ({ children, loading, ...props }: any) => (
  <button
    disabled={loading}
    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full sm:w-auto"
    {...props}
  >
    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {children}
  </button>
);

export default function SettingsPage() {
  const { user } = useAuth();
  
  // --- STATES ---
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchImages = async () => {
      if (!user) return;
      const { data } = await supabase.from('users').select('profile_image').eq('id', user.id).single();
      if (data?.profile_image) setProfilePreview(data.profile_image);
    };
    fetchImages();
  }, [user]);

  const handleProfileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleProfileUpload = async () => {
    if (!profileFile || !user) return;
    setLoading(true); setError(''); setMessage('');
    try {
      const fileExt = profileFile.name.split('.').pop();
      const fileName = `profile_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; 
      
      const { error: uploadError } = await supabase.storage.from('profile-photo').upload(filePath, profileFile);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('profile-photo').getPublicUrl(filePath);

      const { error: historyError } = await supabase.from('user_photos').insert({ user_id: user.id, photo_url: publicUrl });
      if (historyError) throw historyError;

      const { error: dbError } = await supabase.from('users').update({ profile_image: publicUrl }).eq('id', user.id);
      if (dbError) throw dbError;

      setMessage('Profile photo updated successfully!');
      setProfileFile(null);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return; setLoading(true); setError(''); setMessage('');
    const { error } = await supabase.from('users').update({ username: newUsername }).eq('id', user.id);
    if (error) setError('Error updating username.'); else { setMessage('Username updated!'); setNewUsername(''); } setLoading(false);
  };
  
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return; setLoading(true); setError(''); setMessage('');
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) setError(error.message); else { setMessage('Confirmation link sent.'); setNewEmail(''); } setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    if (newPassword.length < 6) { setError('Password too short'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords mismatch'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email!, password: currentPassword });
      if (reauthError) throw new Error('Incorrect current password');
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setMessage('Password updated!'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />
      
      <main className="container max-w-4xl mx-auto p-4 md:p-8 space-y-8 pt-24">
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Feedback Messages */}
        {message && (
          <div className="p-4 rounded-lg bg-green-500/15 border border-green-500/20 text-green-600 dark:text-green-400 font-medium animate-in fade-in slide-in-from-top-2">
            {message}
          </div>
        )}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/15 border border-destructive/20 text-destructive font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          
          {/* Profile Photo Card */}
          <SettingsCard title="Profile Picture" description="Click the image to upload a new photo.">
            <div className="flex flex-col items-center sm:items-start gap-6">
              <div className="flex items-center gap-6">
                <div 
                  onClick={() => profileInputRef.current?.click()} 
                  className="relative group cursor-pointer"
                >
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-muted shadow-xl transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-2xl">
                    {profilePreview ? (
                      <img src={profilePreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
                        <Camera size={40} />
                      </div>
                    )}
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </div>
                
                <div className="space-y-2 text-center sm:text-left">
                   <h4 className="font-medium">Profile Photo</h4>
                   <p className="text-sm text-muted-foreground max-w-[200px]">
                     Supports JPG, PNG or GIF. 
                   </p>
                </div>
              </div>

              <input type="file" ref={profileInputRef} onChange={handleProfileSelect} className="hidden" accept="image/*" />
              
              {profileFile && (
                <div className="w-full sm:w-auto animate-in fade-in zoom-in-95 duration-200">
                  <Button onClick={handleProfileUpload} loading={loading}>
                    <Save className="mr-2 h-4 w-4" /> Save New Photo
                  </Button>
                </div>
              )}
            </div>
          </SettingsCard>

          {/* Username */}
          <SettingsCard title="Username" description="This is your public display name.">
            <form onSubmit={handleUpdateUsername} className="space-y-4 max-w-md">
              <SettingsInput 
                label="New Username"
                placeholder="Enter username" 
                value={newUsername} 
                onChange={(e: any) => setNewUsername(e.target.value)} 
              />
              <div className="flex justify-end">
                <Button type="submit" loading={loading}>Save Username</Button>
              </div>
            </form>
          </SettingsCard>

          {/* Email */}
          <SettingsCard title="Email Address" description="Manage the email address associated with your account.">
            <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-md">
              <SettingsInput 
                label="New Email"
                type="email"
                placeholder="name@example.com" 
                value={newEmail} 
                onChange={(e: any) => setNewEmail(e.target.value)} 
              />
              <div className="flex justify-end">
                <Button type="submit" loading={loading}>Update Email</Button>
              </div>
            </form>
          </SettingsCard>

          {/* Password */}
          <SettingsCard title="Password" description="Change your password to keep your account secure.">
            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <SettingsInput 
                label="Current Password"
                type="password"
                placeholder="••••••••" 
                value={currentPassword} 
                onChange={(e: any) => setCurrentPassword(e.target.value)} 
              />
              <SettingsInput 
                label="New Password"
                type="password"
                placeholder="••••••••" 
                value={newPassword} 
                onChange={(e: any) => setNewPassword(e.target.value)} 
              />
              <SettingsInput 
                label="Confirm New Password"
                type="password"
                placeholder="••••••••" 
                value={confirmPassword} 
                onChange={(e: any) => setConfirmPassword(e.target.value)} 
              />
              <div className="flex justify-end">
                <Button type="submit" loading={loading}>Update Password</Button>
              </div>
            </form>
          </SettingsCard>

          {/* Notifications (Assuming component handles its own styling, wrapped in card for consistency) */}
          <SettingsCard title="Notifications" description="Manage how we contact you.">
             <NotificationToggle />
          </SettingsCard>

        </div>
      </main>
    </div>
  );
}
