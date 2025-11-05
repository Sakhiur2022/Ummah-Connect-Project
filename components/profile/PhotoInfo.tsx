"use client"

import React, { useState } from 'react'
import { Camera, Edit2, Check, X } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'

import { supabase } from '@/lib/supabaseClient'


interface User {
  id: number
  full_name: string
  username: string
  bio: string
  gender: 'male' | 'female'
  profile_photo: string | null
}

interface ProfileInfoProps {
  user: User
  isOwnProfile: boolean
  onUpdate: (updates: Partial<User>) => void
}

export default function ProfileInfo({ user, isOwnProfile, onUpdate }: ProfileInfoProps) {
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioText, setBioText] = useState(user.bio)
  const [isUploading, setIsUploading] = useState(false)

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      // Delete old profile photo
      if (user.profile_photo) {
        const oldPath = user.profile_photo.split('/').pop()
        if (oldPath) {
          await supabase.storage.from('profile-photos').remove([`profiles/${oldPath}`])
        }
      }

      // Upload new photo
      const fileExt = file.name.split('.').pop()
      const fileName = `profile_${user.id}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(`profiles/${fileName}`, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(`profiles/${fileName}`)

      // Update users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_photo: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      onUpdate({ profile_photo: publicUrl })

    } catch (error) {
      console.error('Error uploading profile photo:', error)
      alert('Failed to upload profile photo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleBioSave = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ bio: bioText })
        .eq('id', user.id)

      if (error) throw error

      onUpdate({ bio: bioText })
      setIsEditingBio(false)
    } catch (error) {
      console.error('Error updating bio:', error)
      alert('Failed to update bio')
    }
  }

  return (
    <div className="relative px-8 pb-8">
      {/* Profile Picture */}
      <motion.div 
        className="relative -mt-20 mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="relative w-40 h-40 rounded-full border-4 border-card overflow-hidden bg-gradient-to-br from-amber-500 to-purple-600 shadow-2xl">
          {user.profile_photo ? (
            <img 
              src={user.profile_photo} 
              alt={user.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-white">
              {user.full_name.charAt(0)}
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        {isOwnProfile && (
          <motion.label 
            className={`absolute bottom-2 right-2 bg-amber-500 text-slate-900 p-2 rounded-full shadow-lg ${
              isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-amber-400'
            }`}
            whileHover={{ scale: isUploading ? 1 : 1.1 }}
            whileTap={{ scale: isUploading ? 1 : 0.95 }}
          >
            <Camera className="w-4 h-4" />
            <input 
              type="file" 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp"
              onChange={handleProfilePhotoUpload}
              disabled={isUploading}
            />
          </motion.label>
        )}
      </motion.div>
      
      {/* User Info */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-1">
          {user.full_name}
        </h1>
        <p className="text-muted-foreground">@{user.username}</p>
      </motion.div>
      
      {/* Bio Section */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <AnimatePresence mode="wait">
          {isEditingBio ? (
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                className="w-full p-3 bg-muted/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                rows={3}
                placeholder="Write your bio..."
                maxLength={200}
              />
              <div className="flex gap-2">
                <motion.button
                  onClick={handleBioSave}
                  className="px-4 py-2 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 transition-colors font-medium flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Check className="w-4 h-4" />
                  Save
                </motion.button>
                <motion.button
                  onClick={() => {
                    setIsEditingBio(false)
                    setBioText(user.bio)
                  }}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="flex items-start gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-foreground flex-1">{user.bio || 'No bio yet'}</p>
              {isOwnProfile && (
                <motion.button
                  onClick={() => setIsEditingBio(true)}
                  className="text-amber-500 hover:text-amber-400 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Edit2 className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
