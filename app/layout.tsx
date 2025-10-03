import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import ClientLayout from "./client-layout"
import "./globals.css"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Ummah Connect",
  description: "Emotion Based Islamic Social Media",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <ClientLayout>{children}</ClientLayout>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
