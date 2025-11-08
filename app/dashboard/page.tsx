import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Settings } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto relative">
        {/* Settings Icon Link */}
        <Link 
          href="/settings" 
          className="absolute top-0 right-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6" />
        </Link>
        
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Welcome to Ummah Connect</h1>
            <p className="text-muted-foreground">{"You're successfully logged in!"}</p>
          </div>

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
    </div>
  )
}
