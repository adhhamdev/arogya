import { requirePatient } from "@/lib/auth"
import { getSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, User, FileText, Bell, Clock, TrendingUp, Heart } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

async function getUpcomingAppointments(userId: string) {
  const supabase = await getSupabaseClient()

  const { data } = await supabase
    .from("appointments")
    .select(`
      *,
      doctor:doctors!appointments_doctor_id_fkey(
        id,
        user_profiles!doctors_id_fkey(full_name)
      ),
      specialties:doctors!appointments_doctor_id_fkey(specialties(*))
    `)
    .eq("patient_id", userId)
    .eq("status", "confirmed")
    .gte("appointment_date", new Date().toISOString().split("T")[0])
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })
    .limit(5)

  return data || []
}

async function getRecentPrescriptions(userId: string) {
  const supabase = await getSupabaseClient()

  const { data } = await supabase
    .from("prescriptions")
    .select(`
      *,
      doctor:doctors!prescriptions_doctor_id_fkey(
        user_profiles!doctors_id_fkey(full_name)
      )
    `)
    .eq("patient_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(3)

  return data || []
}

export default async function PatientDashboardPage() {
  const profile = await requirePatient()
  const appointments = await getUpcomingAppointments(profile.id)
  const prescriptions = await getRecentPrescriptions(profile.id)

  const stats = [
    {
      title: "Total Appointments",
      value: "12",
      icon: Calendar,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Upcoming",
      value: appointments.length.toString(),
      icon: Clock,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Medical Records",
      value: "8",
      icon: FileText,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Doctors Consulted",
      value: "5",
      icon: User,
      color: "bg-orange-100 text-orange-600",
    },
  ]

  const quickActions = [
    {
      title: "Book Appointment",
      description: "Schedule with a doctor",
      icon: Calendar,
      href: "/doctors",
      color: "bg-blue-500",
    },
    {
      title: "View Records",
      description: "Access medical history",
      icon: FileText,
      href: "/records",
      color: "bg-green-500",
    },
    {
      title: "Health Metrics",
      description: "Track your progress",
      icon: TrendingUp,
      href: "/metrics",
      color: "bg-purple-500",
    },
    {
      title: "Emergency",
      description: "Urgent consultation",
      icon: Heart,
      href: "/emergency",
      color: "bg-red-500",
    },
  ]

  return (
    <div className="responsive-container">
      <div className="section-padding content-spacing">
        {/* Welcome Header */}
        <div className="mb-8 lg:mb-12">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div>
              <h1 className="heading-responsive text-gray-900">Welcome back, {profile.full_name.split(" ")[0]}!</h1>
              <p className="text-gray-600 body-responsive">Patient Dashboard</p>
            </div>
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Bell className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="mb-8 lg:mb-12">
          <h2 className="subheading-responsive text-gray-900 mb-4 lg:mb-6">Your Health Stats</h2>
          <div className="grid-responsive-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index} className="card-responsive card-hover">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div
                        className={`w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center ${stat.color}`}
                      >
                        <Icon className="w-6 h-6 lg:w-8 lg:h-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 lg:mb-12">
          <h2 className="subheading-responsive text-gray-900 mb-4 lg:mb-6">Quick Actions</h2>
          <div className="grid-responsive-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link key={index} href={action.href}>
                  <Card className="card-responsive card-hover">
                    <CardContent className="p-4 lg:p-6 text-center">
                      <div
                        className={`w-16 h-16 lg:w-20 lg:h-20 ${action.color} rounded-3xl flex items-center justify-center mx-auto mb-4 lg:mb-6`}
                      >
                        <Icon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 lg:text-lg">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="grid-responsive-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="subheading-responsive">Upcoming Appointments</h2>
              <Link href="/appointments">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                  View All
                </Button>
              </Link>
            </div>

            {appointments.length > 0 ? (
              <div className="content-spacing">
                {appointments.map((appointment) => (
                  <Card key={appointment.id} className="card-responsive card-hover">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 lg:space-x-6">
                          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium lg:text-lg">
                              Dr. {appointment.doctor?.user_profiles?.full_name}
                            </h3>
                            <p className="text-sm lg:text-base text-gray-600">
                              {format(new Date(appointment.appointment_date), "MMM dd, yyyy")} at{" "}
                              {appointment.appointment_time}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 lg:px-3 lg:py-2 rounded-full text-xs lg:text-sm font-medium bg-green-100 text-green-800">
                            Confirmed
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-responsive">
                <CardContent className="p-6 lg:p-8 text-center">
                  <Calendar className="w-12 h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-4 lg:mb-6" />
                  <h3 className="font-medium text-gray-900 mb-2 lg:text-lg">No upcoming appointments</h3>
                  <p className="text-gray-600 text-sm lg:text-base mb-4 lg:mb-6">
                    You don't have any scheduled appointments.
                  </p>
                  <Link href="/doctors">
                    <Button className="btn-primary">Book Appointment</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Prescriptions */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="text-lg lg:text-xl font-semibold">Recent Prescriptions</h2>
              <Link href="/records">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                  View All
                </Button>
              </Link>
            </div>

            {prescriptions.length > 0 ? (
              <div className="content-spacing">
                {prescriptions.map((prescription) => (
                  <Card key={prescription.id} className="card-responsive card-hover">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                          <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm lg:text-base truncate">
                            Dr. {prescription.doctor?.user_profiles?.full_name}
                          </h3>
                          <p className="text-xs lg:text-sm text-gray-600">
                            {prescription.medications.length} medication(s)
                          </p>
                          <p className="text-xs text-gray-500">{format(new Date(prescription.created_at), "MMM dd")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-responsive">
                <CardContent className="p-6 lg:p-8 text-center">
                  <FileText className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">No prescriptions yet</h3>
                  <p className="text-gray-600 text-xs lg:text-sm">
                    Your prescriptions will appear here after consultations.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
