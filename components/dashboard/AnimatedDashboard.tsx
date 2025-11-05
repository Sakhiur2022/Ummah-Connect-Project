'use client'

import { motion } from "framer-motion"
import RightSidebar from "@/components/profile/RightSidebar"

type AnimatedDashboardProps = {
  userEmail: string
  userId: string
  createdAt: string
}

export default function AnimatedDashboard({ userEmail, userId, createdAt }: AnimatedDashboardProps) {
  return (
    <motion.div
      className="min-h-screen bg-background p-4 sm:p-8 flex flex-col lg:flex-row gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Main content (left side) */}
      <motion.div
        className="flex-1 max-w-3xl mx-auto space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Welcome to Ummah Connect
          </h1>
          <p className="text-muted-foreground">You're successfully logged in!</p>
        </div>

        <motion.div
          className="bg-card p-6 rounded-lg border shadow-md hover:shadow-lg transition-shadow duration-300"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="space-y-2 text-sm sm:text-base">
            <p>
              <strong>Email:</strong> {userEmail}
            </p>
            <p>
              <strong>User ID:</strong> {userId}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Right sidebar (visible on all screens, stacked on mobile) */}
      <motion.div
        className="lg:w-1/3 w-full"
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      >
        <RightSidebar userId={userId} />
      </motion.div>
    </motion.div>
  )
}