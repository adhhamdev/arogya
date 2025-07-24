import type React from "react"
import { DoctorLayout } from "@/components/doctor-layout"
import { requireDoctor } from "@/lib/auth"

export const metadata = {
  title: "Doctor Portal | Arogya",
  description: "Manage your patients, appointments, and medical practice",
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const doctorProfile = await requireDoctor()

  return <DoctorLayout userProfile={doctorProfile}>{children}</DoctorLayout>
}
