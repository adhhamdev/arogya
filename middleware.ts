import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user profile for role-based routing
  let userRole = null
  if (user) {
    const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()
    userRole = profile?.role
  }

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/signup", "/reset-password", "/auth/callback", "/auth/auth-code-error"]
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith("/auth/"))

  // If user is not authenticated and trying to access protected routes
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If user is authenticated but trying to access auth pages, redirect to appropriate portal
  if (user && userRole && (pathname === "/login" || pathname === "/signup")) {
    if (userRole === "patient") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else if (userRole === "doctor") {
      return NextResponse.redirect(new URL("/doctor", request.url))
    }
  }

  // Role-based route protection
  if (user && userRole) {
    // Patient routes - only accessible by patients
    const patientRoutes = ["/dashboard", "/doctors", "/book", "/appointments", "/records", "/settings"]
    const isPatientRoute = patientRoutes.some((route) => pathname.startsWith(route))

    // Doctor routes - only accessible by doctors
    const doctorRoutes = ["/doctor"]
    const isDoctorRoute = doctorRoutes.some((route) => pathname.startsWith(route))

    // Redirect patients trying to access doctor routes
    if (userRole === "patient" && isDoctorRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Redirect doctors trying to access patient routes
    if (userRole === "doctor" && isPatientRoute) {
      return NextResponse.redirect(new URL("/doctor", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
