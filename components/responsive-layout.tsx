"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { BottomNavigation, SidebarNavigation } from "./navigation"

interface ResponsiveLayoutProps {
  children: React.ReactNode
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const pathname = usePathname()

  // Don't show navigation on login/signup pages
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/"

  // Check if we're in doctor portal
  const isDoctorPortal = pathname.startsWith("/doctor")

  if (isAuthPage || isDoctorPortal) {
    return <>{children}</>
  }

  return (
    <div className="desktop-layout">
      <SidebarNavigation />
      <main className="desktop-main">
        <div className="mobile-bottom-padding">{children}</div>
      </main>
      <BottomNavigation />
    </div>
  )
}
