import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AnimatedDashboard from "@/components/dashboard/AnimatedDashboard"
import Header from "@/components/ui/header"
import { Settings } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user || !data.user.email) {
    redirect("/")
  }

  return (
    <>
      <Header />
      <div className="absolute top-4 right-4">
        <Link 
          href="/settings" 
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6" />
        </Link>
      </div>
      <AnimatedDashboard
        userEmail={data.user.email}
        userId={data.user.id}
        createdAt={data.user.created_at}
      />
    </>
  )
}
