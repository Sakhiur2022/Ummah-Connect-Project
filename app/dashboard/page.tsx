import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AnimatedDashboard from "@/components/dashboard/AnimatedDashboard"
import Header from "@/components/ui/header"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user || !data.user.email) {
    redirect("/")
  }

  return (
    <>
    <Header/>
    <AnimatedDashboard
      userEmail={data.user.email}
      userId={data.user.id}
      createdAt={data.user.created_at}
    />
    </>
  )
}
