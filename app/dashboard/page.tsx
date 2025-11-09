import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Settings } from "lucide-react"
import Header from "@/components/ui/header"
import AnimatedDashboard from "@/components/dashboard/AnimatedDashboard"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/")
  }

  return (
    <>
      <Header />
      <AnimatedDashboard
        userEmail={data.user.email || ""}
        userId={data.user.id}
        createdAt={data.user.created_at}
      />
      
      {/* Settings Icon Link */}
      <div className="fixed bottom-8 right-8">
        <Link
          href="/settings"
          className="p-3 rounded-full bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/20 transition-all duration-200 hover:scale-110"
          title="Settings"
        >
          <Settings className="w-6 h-6 text-cyan-200" />
        </Link>
      </div>
    </>
  )
}
