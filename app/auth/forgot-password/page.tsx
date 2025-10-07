"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnimatedBackground } from "@/components/animated-background"
import { CrescentIcon } from "@/components/crescent-icon"
import { useAudio } from "@/lib/audio-context"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { audioData } = useAudio()

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
          ? `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL}/auth/reset-password`
          : `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground theme="islamic" backgroundImage="/images/islamic-night-scene.png" audioData={audioData} />

      <div className="absolute top-20 left-20 animate-float">
        <div
          className="w-4 h-4 bg-amber-400 rounded-full animate-glow opacity-60 shadow-lg shadow-amber-400/50 transition-all duration-300"
          style={{
            transform: audioData?.beat ? "scale(1.5)" : "scale(1)",
            opacity: audioData ? 0.6 + audioData.amplitude * 0.4 : 0.6,
          }}
        />
      </div>
      <div className="absolute top-40 right-32 animate-float" style={{ animationDelay: "1s" }}>
        <div
          className="w-3 h-3 bg-yellow-300 rounded-full animate-twinkle opacity-40 shadow-md shadow-yellow-300/40 transition-all duration-300"
          style={{
            transform: audioData?.beat ? "scale(1.3)" : "scale(1)",
            opacity: audioData ? 0.4 + audioData.amplitude * 0.3 : 0.4,
          }}
        />
      </div>

      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 relative z-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <CrescentIcon
                    className="w-16 h-16 text-amber-400 animate-glow drop-shadow-lg transition-all duration-300"
                    style={{
                      transform: audioData?.beat ? "scale(1.1)" : "scale(1)",
                      filter: audioData ? `brightness(${1 + audioData.amplitude * 0.5})` : "brightness(1)",
                    }}
                  />
                  <div
                    className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-300 rounded-full animate-twinkle shadow-lg shadow-yellow-300/50 transition-all duration-300"
                    style={{
                      transform: audioData?.beat ? "scale(1.3)" : "scale(1)",
                      opacity: audioData ? 0.8 + audioData.amplitude * 0.2 : 0.8,
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h1
                  className="text-4xl font-bold text-balance text-amber-400 drop-shadow-lg transition-all duration-300"
                  style={{
                    textShadow: audioData?.beat ? "0 0 20px rgba(251, 191, 36, 0.8)" : "none",
                    transform: audioData?.beat ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  Reset Password
                </h1>
                <p className="text-slate-200 text-pretty drop-shadow-sm">
                  {"Enter your email to receive a password reset link"}
                </p>
              </div>
            </div>

            <Card
              className="backdrop-blur-md bg-slate-900/60 border-slate-700/50 shadow-2xl shadow-slate-900/50 transition-all duration-300"
              style={{
                backdropFilter: audioData ? `blur(${12 + audioData.amplitude * 4}px)` : "blur(12px)",
                boxShadow: audioData?.beat
                  ? "0 25px 50px -12px rgba(0, 0, 0, 0.4)"
                  : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center text-slate-100">Forgot Password</CardTitle>
                <CardDescription className="text-center text-slate-300">
                  {"We'll send you a link to reset your password"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {success ? (
                  <div className="space-y-6">
                    <Alert className="bg-green-500/10 border-green-500/20">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-sm text-green-500">
                        Password reset link has been sent to your email, brother. Please check your inbox and follow the
                        instructions.
                      </AlertDescription>
                    </Alert>
                    <div className="text-center">
                      <Link
                        href="/"
                        className="text-sm text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors"
                      >
                        Back to Sign In
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleResetRequest} className="space-y-6">
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
                          Sending reset link...
                        </div>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>

                    <div className="text-center">
                      <Link
                        href="/"
                        className="text-sm text-slate-300 hover:text-slate-200 underline underline-offset-4 transition-colors"
                      >
                        Back to Sign In
                      </Link>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
