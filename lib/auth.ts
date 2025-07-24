import { getSupabaseClient } from "./supabase/server"
import { redirect } from "next/navigation"
import type { UserProfile } from "./supabase/types"

export async function getUser() {
  const supabase = await getSupabaseClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await getSupabaseClient()
  const user = await getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

  return profile
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

export async function requireRole(role: "patient" | "doctor" | "admin") {
  const profile = await getUserProfile()
  if (!profile) {
    redirect("/login")
  }

  if (profile.role !== role) {
    // Redirect to appropriate portal based on user's actual role
    if (profile.role === "patient") {
      redirect("/dashboard")
    } else if (profile.role === "doctor") {
      redirect("/doctor")
    } else {
      redirect("/login")
    }
  }
  return profile
}

export async function requirePatient() {
  return await requireRole("patient")
}

export async function requireDoctor() {
  return await requireRole("doctor")
}

export async function redirectToPortal() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect("/login")
  }

  if (profile.role === "patient") {
    redirect("/dashboard")
  } else if (profile.role === "doctor") {
    redirect("/doctor")
  } else {
    redirect("/login")
  }
}
