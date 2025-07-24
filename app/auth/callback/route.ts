import { getSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await getSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Get user profile to determine redirect
      const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", data.user.id).single()

      if (profile) {
        // Redirect based on user role
        if (profile.role === "patient") {
          return NextResponse.redirect(`${origin}/dashboard`)
        } else if (profile.role === "doctor") {
          return NextResponse.redirect(`${origin}/doctor`)
        }
      }

      // Default redirect if no profile found
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
