import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ResponsiveLayout } from "@/components/responsive-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Arogya - Telemedicine Platform",
  description: "Connect with verified doctors in Sri Lanka for online consultations",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Arogya",
  },
  formatDetection: {
    telephone: false,
  },
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ResponsiveLayout>{children}</ResponsiveLayout>
        <Toaster />
      </body>
    </html>
  )
}
