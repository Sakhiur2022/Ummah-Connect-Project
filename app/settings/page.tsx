'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/ui/header';
import NotificationToggle from '@/components/settings/NotificationToggle';
import { Camera, Save, Loader2 } from 'lucide-react';
import { ProfileAnimatedBackground } from '@/components/background/profile-animated-background';
import { useThemeSafe } from '@/lib/use-theme-safe';
import CropperModal from '@/components/CropperModal'; // ⬅️ NEW

// --- Reusable Input Component ---
const SettingsInput = ({ label, ...props }: any) => {
  const { theme } = useThemeSafe();
  return (
    <div className="space-y-2">
      <label className={`text-sm font-medium leading-none ${theme === 'light' ? 'text-amber-950' : 'text-cyan-100'}`}>
        {label}
      </label>
      <input
        className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background 
          file:border-0 file:bg-transparent file:text-sm file:font-medium 
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
          transition-all duration-200 
          ${
            theme === 'light'
              ? 'border-amber-300 bg-white text-amber-950 placeholder-amber-600 focus-visible:ring-amber-500/60'
              : 'border-slate-700/80 bg-slate-800/40 text-cyan-50 placeholder-slate-400 focus-visible:ring-cyan-500/50'
          }`}
        {...props}
      />
    </div>
  );
};

// --- Reusable Card Component ---
const SettingsCard = ({ title, description, children }: any) => {
  const { theme } = useThemeSafe();
  return (
    <div
      className={`rounded-xl backdrop-blur-md p-6 border ${
        theme === 'light'
          ? 'border-amber-300 bg-white/70 shadow-lg shadow-amber-200/40'
          : 'border-slate-700/60 bg-slate-900/40 shadow-lg shadow-black/50'
      }`}
    >
      <div
        className="flex flex-col space-y-1.5 pb-6 border-b"
        style={{
          borderColor: theme === 'light' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(51, 65, 85, 0.4)',
        }}
      >
        <h3 className={`text-2xl font-semibold ${theme === 'light' ? 'text-amber-950' : 'text-slate-100'}`}>
          {title}
        </h3>
        {description && (
          <p className={`text-sm ${theme === 'light' ? 'text-amber-700' : 'text-slate-400'}`}>{description}</p>
        )}
      </div>
      <div className="p-0 pt-6">{children}</div>
    </div>
  );
};

// --- Reusable Button Component ---
const Button = ({ children, loading, ...props }: any) => (
  <button
    disabled={loading}
    className="inline-flex items-center justify-center rounded-md text-sm font-medium 
      ring-offset-background transition-colors 
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
      disabled:pointer-events-none disabled:opacity-50 
      bg-primary text-primary-foreground hover:bg-primary/90 
      h-10 px-4 py-2 w-full sm:w-auto"
    {...props}
  >
    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {children}
  </button>
);

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme } = useThemeSafe();

  // --- STATES ---
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  // NEW for cropping:
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // --- Fetch existing profile photo ---
  useEffect(() => {
    const fetchImages = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('users')
        .select('profile_image')
        .eq('id', user.id)
        .single();

      if (data?.profile_image) setProfilePreview(data.profile_image);
    };
    fetchImages();
  }, [user]);

  // --- Select Image → Open Crop Modal ---
  const handleProfileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    const MAX_SIZE_MB = 2;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }

    const url = URL.createObjectURL(file);

    setImageToCrop(url);
    setShowCropper(true);
  };

  // --- Receive Cropped Image ---
  const handleCroppedImage = (blob: Blob) => {
    const croppedFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });

    setProfileFile(croppedFile);
    setProfilePreview(URL.createObjectURL(croppedFile));
  };

  // --- Upload Profile Photo ---
  const handleProfileUpload = async () => {
    if (!profileFile || !user) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const fileExt = 'jpg';
      const fileName = `profile_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photo')
        .upload(filePath, profileFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-photo').getPublicUrl(filePath);

      await supabase.from('user_photos').insert({
        user_id: user.id,
        photo_url: publicUrl,
      });

      await supabase.from('users').update({ profile_image: publicUrl }).eq('id', user.id);

      setMessage('Profile photo updated successfully!');
      setProfileFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Username Update ---
  const handleUpdateUsername = async (e: any) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase
      .from('users')
      .update({ username: newUsername })
      .eq('id', user.id);

    if (error) setError('Error updating username.');
    else {
      setMessage('Username updated!');
      setNewUsername('');
    }
    setLoading(false);
  };

  // --- Email Update ---
  const handleUpdateEmail = async (e: any) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) setError(error.message);
    else {
      setMessage('Confirmation link sent.');
      setNewEmail('');
    }
    setLoading(false);
  };

  // --- Password Update ---
  const handleUpdatePassword = async (e: any) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword.length < 6) {
      setError('Password too short');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords mismatch');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (reauthError) throw new Error('Incorrect current password');

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setMessage('Password updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground transition-colors duration-300">
      <Header />
      <ProfileAnimatedBackground />

      <main className="container max-w-4xl mx-auto p-4 md:p-8 space-y-8 pt-24">
        <SettingsCard title="Settings" description="Manage your account settings and preferences." />

        {message && (
          <div className="p-4 rounded-lg bg-green-500/15 border border-green-500/20 text-green-600 dark:text-green-400 font-medium">
            {message}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-destructive/15 border border-destructive/20 text-destructive font-medium">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          {/* Profile Photo */}
          <SettingsCard title="Profile Picture" description="Click the image to upload a new photo.">
            <div className="flex flex-col items-center sm:items-start gap-6">
              <div className="flex items-center gap-6">
                <div
                  onClick={() => profileInputRef.current?.click()}
                  className="relative group cursor-pointer"
                >
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-muted shadow-xl">
                    {profilePreview ? (
                      <img src={profilePreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
                        <Camera size={40} />
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <h4 className={`font-medium ${theme === 'light' ? 'text-amber-950' : 'text-slate-100'}`}>
                    Profile Photo
                  </h4>
                  <p className={`text-sm max-w-[200px] ${theme === 'light' ? 'text-amber-700' : 'text-slate-400'}`}>
                    Supports JPG, PNG or GIF. Max 2 MB.
                  </p>
                </div>
              </div>

              <input
                type="file"
                ref={profileInputRef}
                onChange={handleProfileSelect}
                className="hidden"
                accept="image/*"
              />
              {error && (
  <div className="p-3 mt-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in">
    {error}
  </div>
)}


              {profileFile && (
                <div className="w-full sm:w-auto">
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
                <Button type="submit" loading={loading}>
                  Save Username
                </Button>
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
                <Button type="submit" loading={loading}>
                  Update Email
                </Button>
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
                <Button type="submit" loading={loading}>
                  Update Password
                </Button>
              </div>
            </form>
          </SettingsCard>

          {/* Notifications */}
          <SettingsCard title="Notifications" description="Manage how we contact you.">
            <NotificationToggle />
          </SettingsCard>
        </div>
      </main>

      {/* CROP MODAL */}
      {showCropper && imageToCrop && (
        <CropperModal
          image={imageToCrop}
          onClose={() => setShowCropper(false)}
          onCropComplete={handleCroppedImage}
        />
      )}
    </div>
  );
}
