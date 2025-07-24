"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Search, Calendar, FileText, Settings, User, Stethoscope, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { UserProfile } from "@/lib/supabase/types"

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    mobileLabel: "Home",
  },
  {
    name: "Find Doctors",
    href: "/doctors",
    icon: Search,
    mobileLabel: "Doctors",
  },
  {
    name: "Appointments",
    href: "/appointments",
    icon: Calendar,
    mobileLabel: "Bookings",
  },
  {
    name: "Medical Records",
    href: "/records",
    icon: FileText,
    mobileLabel: "Records",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    mobileLabel: "Settings",
  },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      <div className="flex justify-around">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.mobileLabel}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function SidebarNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
          setProfile(profile)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", session.user.id).single()
        setProfile(profile)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        })
        router.push("/")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <aside className="sidebar-layout">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Arogya</h1>
            <p className="text-sm text-gray-500">Telemedicine Platform</p>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href} className={`sidebar-nav-item ${isActive ? "active" : ""}`}>
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200">
        {isLoading ? (
          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-gray-50">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center animate-pulse">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
          </div>
        ) : profile ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-gray-50">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">{profile.full_name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{profile.role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Link href="/login">
              <button className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                <User className="w-4 h-4 mr-2" />
                Sign In
              </button>
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
