"use client"

import { motion } from "framer-motion"
import FriendRequests from "@/components/profile/FriendRequests"
import PhotoGallery from "@/components/profile/PhotoGallery"

export default function RightSidebar({ userId }: { userId: string }) {
  return (
    <motion.aside
      className="lg:w-full w-full space-y-4 p-4 bg-card border rounded-lg shadow-sm"
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <FriendRequests userId={userId} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <PhotoGallery userId={userId} />
      </motion.div>
    </motion.aside>
  )
}
