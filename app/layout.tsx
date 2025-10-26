import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./client-layout"
import "./globals.css"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Ummah Connect",
  description: "Emotion Based Islamic Social Media for Women Cyber Safety",
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any'
      },
      {
        url: '/favicon.svg',
        type: 'image/svg+xml'
      },
      {
        url: '/icons/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png'
      },
      {
        url: '/icons/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png'
      }
    ],
    apple: [
      {
        url: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ],
    other: [
      {
        rel: 'manifest',
        url: '/site.webmanifest'
      }
    ]
  },
  themeColor: '#070B1C'
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
      </body>
    </html>
  )
}
