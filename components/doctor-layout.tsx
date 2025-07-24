"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DoctorNavigation } from "./doctor-navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import type { UserProfile } from "@/lib/supabase/types"

interface DoctorLayoutProps {
  children: React.ReactNode
  userProfile?: UserProfile | null
}

export function DoctorLayout({ children, userProfile }: DoctorLayoutProps) {
  const isMobile = useIsMobile()
  const [doctorName, setDoctorName] = useState<string>("Doctor")

  useEffect(() => {
    if (userProfile?.full_name) {
      setDoctorName(userProfile.full_name)
    }
  }, [userProfile])

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavigation doctorName={doctorName} doctorAvatar={userProfile?.avatar_url || undefined} />
      <div className={`${isMobile ? "pt-16 pb-16" : "ml-64"}`}>
        <div className="container mx-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  )
}
