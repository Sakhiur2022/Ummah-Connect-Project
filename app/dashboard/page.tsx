import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Settings } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Welcome to Ummah Connect</h1>
            <p className="text-muted-foreground">{"You're successfully logged in!"}</p>
          </div>

          {/* User Info Card */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="space-y-2">
              <p>
                <strong>Email:</strong> {data.user.email}
              </p>
              <p>
                <strong>User ID:</strong> {data.user.id}
              </p>
              <p>
                <strong>Created:</strong> {new Date(data.user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Icon at Bottom */}
      <div className="flex justify-center mt-8">
        <Link
          href="/settings"
          className="text-muted-foreground hover:text-foreground transition"
        >
          <Settings className="w-8 h-8" />
        </Link>
      </div>
    </div>
  )
}
