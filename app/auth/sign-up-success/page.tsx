import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IslamicBackground } from "@/components/islamic-background"
import { CrescentIcon } from "@/components/crescent-icon"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <IslamicBackground />

      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 relative z-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <CrescentIcon className="w-16 h-16 text-primary animate-glow" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-accent rounded-full animate-twinkle" />
                </div>
              </div>
            </div>

            {/* Success Card */}
            <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl text-foreground">Welcome to Ummah Connect!</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Please check your email to verify your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {
                        "We've sent a verification email to your inbox. Please click the link in the email to activate your account."
                      }
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                      {"Didn't receive the email? Check your spam folder or "}
                      <Link href="/auth/sign-up" className="text-primary hover:text-primary/80 underline">
                        try again
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    href="/"
                    className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                  >
                    Return to sign in
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
