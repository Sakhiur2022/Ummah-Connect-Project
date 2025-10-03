"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnimatedBackground } from "@/components/animated-background"
import { CrescentIcon } from "@/components/crescent-icon"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground theme="islamic" backgroundImage="/images/islamic-night-scene.png" />

      <div className="absolute top-20 left-20 animate-float">
        <div className="w-4 h-4 bg-amber-400 rounded-full animate-glow opacity-60 shadow-lg shadow-amber-400/50" />
      </div>
      <div className="absolute top-40 right-32 animate-float" style={{ animationDelay: "1s" }}>
        <div className="w-3 h-3 bg-yellow-300 rounded-full animate-twinkle opacity-40 shadow-md shadow-yellow-300/40" />
      </div>
      <div className="absolute bottom-32 left-16 animate-float" style={{ animationDelay: "2s" }}>
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-glow opacity-50 shadow-sm shadow-amber-400/50" />
      </div>
      <div className="absolute top-60 left-1/4 animate-float" style={{ animationDelay: "0.5s" }}>
        <div className="w-3 h-3 bg-yellow-300 rounded-full animate-twinkle opacity-30 shadow-md shadow-yellow-300/30" />
      </div>

      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 relative z-20">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <CrescentIcon className="w-16 h-16 text-amber-400 animate-glow drop-shadow-lg" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-300 rounded-full animate-twinkle shadow-lg shadow-yellow-300/50" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-balance text-amber-400 drop-shadow-lg">Ummah Connect</h1>
                <p className="text-slate-200 text-pretty drop-shadow-sm">{"Connecting hearts across the Ummah"}</p>
              </div>
            </div>

            <Card className="backdrop-blur-md bg-slate-900/60 border-slate-700/50 shadow-2xl shadow-slate-900/50">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center text-slate-100">Welcome Back</CardTitle>
                <CardDescription className="text-center text-slate-300">
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-200">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-400 focus:border-amber-400 focus:ring-amber-400/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-200">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-400 focus:border-amber-400 focus:ring-amber-400/20"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-md bg-red-900/20 border border-red-700/30">
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium py-2.5 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/25"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-slate-300">
                      {"Don't have an account? "}
                      <Link
                        href="/auth/sign-up"
                        className="text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors"
                      >
                        Create one
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-slate-400/80 drop-shadow-sm">{"Built with ❤️ for the Muslim community"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
