"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

type Photo = {
  id: string
  url: string
  caption?: string
}

export default function PhotoGallery({ userId }: { userId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from("PHOTOS")
        .select("id, url, caption")
        .eq("uid", userId)
        .limit(6)

      if (error) console.error("Error fetching photos:", error)
      else setPhotos(data || [])
      setLoading(false)
    }

    fetchPhotos()
  }, [userId, supabase])

  if (loading) {
    return (
      <div className="p-4 bg-card border rounded-lg">
        <p className="text-sm text-muted-foreground">Loading photos...</p>
      </div>
    )
  }

  if (!photos.length) {
    return (
      <div className="p-4 bg-card border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Photo Gallery</h3>
        <p className="text-sm text-muted-foreground">No photos uploaded yet.</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-card border rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Photo Gallery</h3>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <motion.img
            key={photo.id}
            src={photo.url}
            alt={photo.caption || "User photo"}
            className="rounded-md object-cover aspect-square border border-border cursor-pointer"
            whileHover={{ scale: 1.05, rotate: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
          />
        ))}
      </div>
    </div>
  )
}
