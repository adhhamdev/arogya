"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { Calendar, Users, Home, Settings, Clock, BarChart3, LogOut, Menu, X, Bell, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface DoctorNavigationProps {
  doctorName?: string
  doctorAvatar?: string
}

export function DoctorNavigation({ doctorName = "Dr. Smith", doctorAvatar }: DoctorNavigationProps) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      })
      router.push("/login")
    }
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/doctor",
      icon: Home,
      active: pathname === "/doctor",
    },
    {
      name: "Appointments",
      href: "/doctor/appointments",
      icon: Calendar,
      active: pathname === "/doctor/appointments",
      badge: 3,
    },
    {
      name: "Patients",
      href: "/doctor/patients",
      icon: Users,
      active: pathname === "/doctor/patients",
    },
    {
      name: "Schedule",
      href: "/doctor/schedule",
      icon: Clock,
      active: pathname === "/doctor/schedule",
    },
    {
      name: "Analytics",
      href: "/doctor/analytics",
      icon: BarChart3,
      active: pathname === "/doctor/analytics",
    },
    {
      name: "Settings",
      href: "/doctor/settings",
      icon: Settings,
      active: pathname === "/doctor/settings",
    },
  ]

  // Mobile bottom navigation
  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30">
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-green-700">Doctor Portal</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={doctorAvatar || "/placeholder.svg"} alt={doctorName} />
                    <AvatarFallback className="bg-green-100 text-green-800">
                      {doctorName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/doctor/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Slide-in Menu */}
        <div
          className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        ></div>

        <div
          className={`fixed top-16 left-0 bottom-0 w-64 bg-white z-40 transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={doctorAvatar || "/placeholder.svg"} alt={doctorName} />
                  <AvatarFallback className="bg-green-100 text-green-800">
                    {doctorName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{doctorName}</p>
                  <p className="text-xs text-gray-500">Doctor</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
                        item.active
                          ? "bg-green-50 text-green-700"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <item.icon size={20} />
                      <span>{item.name}</span>
                      {item.badge && (
                        <Badge variant="outline" className="ml-auto bg-green-100 text-green-800 border-green-200">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="p-4 border-t">
              <Button onClick={handleSignOut} variant="outline" className="w-full justify-start bg-transparent">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
          <div className="grid grid-cols-5 h-16">
            {navItems.slice(0, 5).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 ${
                  item.active ? "text-green-700" : "text-gray-600"
                }`}
              >
                <item.icon size={20} />
                <span className="text-xs">{item.name}</span>
                {item.badge && (
                  <span className="absolute top-2 right-1/4 w-4 h-4 bg-green-600 rounded-full text-white text-xs flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Content Padding for Mobile */}
        <div className="pt-16 pb-16"></div>
      </>
    )
  }

  // Desktop sidebar navigation
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <User className="text-white" size={18} />
            </div>
            <h1 className="text-lg font-semibold text-green-700">Doctor Portal</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="p-2">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
                      item.active ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon size={20} />
                    <span>{item.name}</span>
                    {item.badge && (
                      <Badge variant="outline" className="ml-auto bg-green-100 text-green-800 border-green-200">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={doctorAvatar || "/placeholder.svg"} alt={doctorName} />
                <AvatarFallback className="bg-green-100 text-green-800">
                  {doctorName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{doctorName}</p>
                <p className="text-xs text-gray-500">Doctor</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/doctor/settings">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
