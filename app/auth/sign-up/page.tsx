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
import { AudioVisualizer } from "@/components/audio-visualizer"
import { CrescentIcon } from "@/components/crescent-icon"
import Link from "next/link"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [audioData, setAudioData] = useState<{ frequency: number; amplitude: number; beat: boolean } | undefined>()
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            username,
            full_name: fullName,
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground audioData={audioData} theme="islamic" backgroundImage="/images/islamic-night-scene.png" />

      <div className="absolute top-20 left-20 animate-float">
        <div
          className="w-4 h-4 bg-primary rounded-full animate-glow opacity-60 transition-all duration-300"
          style={{
            transform: audioData?.beat ? "scale(1.5)" : "scale(1)",
            opacity: audioData ? 0.6 + audioData.amplitude * 0.4 : 0.6,
          }}
        />
      </div>
      <div className="absolute top-40 right-32 animate-float" style={{ animationDelay: "1s" }}>
        <div
          className="w-3 h-3 bg-accent rounded-full animate-twinkle opacity-40 transition-all duration-300"
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
                    className="w-16 h-16 text-primary animate-glow transition-all duration-300"
                    style={{
                      transform: audioData?.beat ? "scale(1.1)" : "scale(1)",
                      filter: audioData ? `brightness(${1 + audioData.amplitude * 0.5})` : "brightness(1)",
                    }}
                  />
                  <div
                    className="absolute -top-2 -right-2 w-4 h-4 bg-accent rounded-full animate-twinkle transition-all duration-300"
                    style={{
                      transform: audioData?.beat ? "scale(1.3)" : "scale(1)",
                      opacity: audioData ? 0.8 + audioData.amplitude * 0.2 : 0.8,
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h1
                  className="text-4xl font-bold text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent transition-all duration-300"
                  style={{
                    textShadow: audioData?.beat ? "0 0 20px rgba(251, 191, 36, 0.8)" : "none",
                    transform: audioData?.beat ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  Join Ummah Connect
                </h1>
                <p className="text-muted-foreground text-pretty">
                  {"Create your account to connect with the community"}
                </p>
              </div>
            </div>

            <Card
              className="backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl transition-all duration-300"
              style={{
                backdropFilter: audioData ? `blur(${8 + audioData.amplitude * 4}px)` : "blur(8px)",
                boxShadow: audioData?.beat
                  ? "0 25px 50px -12px rgba(0, 0, 0, 0.4)"
                  : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center text-foreground">Create Account</CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  Fill in your details to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-foreground">
                          Full Name
                        </Label>
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Your full name"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-foreground">
                          Username
                        </Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Choose username"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-foreground">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-foreground">
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {"Already have an account? "}
                      <Link
                        href="/"
                        className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                      >
                        Sign in
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AudioVisualizer audioSrc="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Love%20and%20Life%20%28Slowed%20%2B%20Echo%29%20by%20Baraa%20Masoud-ibe1Ere18rvPrY76MzlfxYceVSeyAh.mp3" onAudioData={setAudioData} />
    </div>
  )
}
