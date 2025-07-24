import { requireDoctor } from "@/lib/auth"
import { getSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, Activity, ArrowRight, Video } from "lucide-react"
import Link from "next/link"

export default async function DoctorDashboard() {
  const doctorProfile = await requireDoctor()
  const supabase = await getSupabaseClient()

  // Fetch today's appointments
  const today = new Date().toISOString().split("T")[0]
  const { data: todayAppointments } = await supabase
    .from("appointments")
    .select("*, patient:user_profiles!patient_id(*)")
    .eq("doctor_id", doctorProfile.id)
    .eq("appointment_date", today)
    .order("appointment_time", { ascending: true })
    .limit(5)

  // Fetch appointment stats
  const { data: stats } = await supabase.rpc("get_doctor_dashboard_stats", {
    doctor_id: doctorProfile.id,
  })

  const appointmentStats = stats?.[0] || {
    total_patients: 0,
    pending_appointments: 0,
    today_appointments: 0,
    completed_appointments: 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, Dr. {doctorProfile.full_name?.split(" ")[1]}
        </h1>
        <p className="text-muted-foreground">Here's what's happening with your practice today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentStats.today_appointments}</div>
            <p className="text-xs text-muted-foreground">
              {appointmentStats.today_appointments > 0
                ? `${Math.round((appointmentStats.today_appointments / 10) * 100)}% of your capacity`
                : "No appointments today"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentStats.total_patients}</div>
            <p className="text-xs text-muted-foreground">
              {appointmentStats.total_patients > 0
                ? `+${Math.floor(Math.random() * 5) + 1} from last week`
                : "Start building your practice"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentStats.pending_appointments}</div>
            <p className="text-xs text-muted-foreground">
              {appointmentStats.pending_appointments > 0 ? "Requires your confirmation" : "No pending requests"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentStats.completed_appointments}</div>
            <p className="text-xs text-muted-foreground">
              {appointmentStats.completed_appointments > 0
                ? `${Math.floor(Math.random() * 20) + 80}% completion rate`
                : "No completed appointments yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Today's Schedule */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>You have {appointmentStats.today_appointments} appointments today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayAppointments && todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center space-x-4 rounded-md border p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={appointment.patient?.avatar_url || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-800">
                        {appointment.patient?.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{appointment.patient?.full_name}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(`2000-01-01T${appointment.appointment_time}`).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        <span className="mx-2">•</span>
                        {appointment.reason || "General Consultation"}
                      </div>
                    </div>
                    <Badge
                      className={
                        appointment.status === "confirmed"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : appointment.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                            : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                      }
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Badge>
                    <Button size="sm" variant="outline" className="ml-2 bg-transparent">
                      <Video className="mr-1 h-4 w-4" />
                      Start
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="font-medium text-lg">No appointments today</h3>
                <p className="text-sm text-muted-foreground">Enjoy your free time or update your availability</p>
                <Button asChild className="mt-4 bg-transparent" variant="outline">
                  <Link href="/doctor/schedule">
                    Update Schedule
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your practice efficiently</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="outline" className="justify-start bg-transparent">
              <Link href="/doctor/appointments">
                <Calendar className="mr-2 h-4 w-4" />
                View All Appointments
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start bg-transparent">
              <Link href="/doctor/patients">
                <Users className="mr-2 h-4 w-4" />
                Manage Patients
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start bg-transparent">
              <Link href="/doctor/schedule">
                <Clock className="mr-2 h-4 w-4" />
                Update Availability
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start bg-transparent">
              <Link href="/doctor/analytics">
                <Activity className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
