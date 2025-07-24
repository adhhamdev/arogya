import { requireDoctor } from "@/lib/auth"
import { getSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Video, Check, X, Phone, FileText } from "lucide-react"

export default async function DoctorAppointments() {
  const doctorProfile = await requireDoctor()
  const supabase = await getSupabaseClient()

  // Fetch appointments by status
  const { data: pendingAppointments } = await supabase
    .from("appointments")
    .select("*, patient:user_profiles!patient_id(*)")
    .eq("doctor_id", doctorProfile.id)
    .eq("status", "pending")
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })

  const { data: confirmedAppointments } = await supabase
    .from("appointments")
    .select("*, patient:user_profiles!patient_id(*)")
    .eq("doctor_id", doctorProfile.id)
    .eq("status", "confirmed")
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })

  const { data: completedAppointments } = await supabase
    .from("appointments")
    .select("*, patient:user_profiles!patient_id(*)")
    .eq("doctor_id", doctorProfile.id)
    .eq("status", "completed")
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false })
    .limit(10)

  const formatAppointmentDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  const formatAppointmentTime = (timeStr: string) => {
    const time = new Date(`2000-01-01T${timeStr}`)
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
        <p className="text-muted-foreground">Manage your patient appointments and consultations.</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingAppointments && pendingAppointments.length > 0 && (
              <Badge className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                {pendingAppointments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {/* Pending Appointments Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Appointment Requests</CardTitle>
              <CardDescription>These appointments require your confirmation or rescheduling.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingAppointments && pendingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {pendingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-md border p-4"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={appointment.patient?.avatar_url || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-800">
                            {appointment.patient?.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="font-medium">{appointment.patient?.full_name}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3" />
                              {formatAppointmentDate(appointment.appointment_date)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {formatAppointmentTime(appointment.appointment_time)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-2">
                        <Button size="sm" variant="outline" className="justify-center bg-transparent">
                          <Phone className="mr-2 h-4 w-4" />
                          {appointment.patient?.phone || "Contact"}
                        </Button>
                        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                          <Check className="mr-2 h-4 w-4" />
                          Confirm
                        </Button>
                        <Button size="sm" variant="destructive">
                          <X className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="font-medium text-lg">No pending appointments</h3>
                  <p className="text-sm text-muted-foreground">You're all caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Confirmed Appointments Tab */}
        <TabsContent value="confirmed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Confirmed Appointments</CardTitle>
              <CardDescription>These appointments are scheduled and confirmed for consultation.</CardDescription>
            </CardHeader>
            <CardContent>
              {confirmedAppointments && confirmedAppointments.length > 0 ? (
                <div className="space-y-4">
                  {confirmedAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-md border p-4"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={appointment.patient?.avatar_url || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-800">
                            {appointment.patient?.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="font-medium">{appointment.patient?.full_name}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3" />
                              {formatAppointmentDate(appointment.appointment_date)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {formatAppointmentTime(appointment.appointment_time)}
                            </div>
                            <span>•</span>
                            <span>{appointment.reason || "General Consultation"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-2">
                        <Button size="sm" variant="outline">
                          <FileText className="mr-2 h-4 w-4" />
                          View Notes
                        </Button>
                        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                          <Video className="mr-2 h-4 w-4" />
                          Start Consultation
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="font-medium text-lg">No confirmed appointments</h3>
                  <p className="text-sm text-muted-foreground">Check the pending tab for appointment requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Appointments Tab */}
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Appointments</CardTitle>
              <CardDescription>Review your past consultations and patient history.</CardDescription>
            </CardHeader>
            <CardContent>
              {completedAppointments && completedAppointments.length > 0 ? (
                <div className="space-y-4">
                  {completedAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-md border p-4"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={appointment.patient?.avatar_url || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-800">
                            {appointment.patient?.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="font-medium">{appointment.patient?.full_name}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3" />
                              {formatAppointmentDate(appointment.appointment_date)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {formatAppointmentTime(appointment.appointment_time)}
                            </div>
                            <span>•</span>
                            <span>{appointment.reason || "General Consultation"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-2">
                        <Button size="sm" variant="outline">
                          <FileText className="mr-2 h-4 w-4" />
                          View Medical Record
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="font-medium text-lg">No completed appointments</h3>
                  <p className="text-sm text-muted-foreground">Your consultation history will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
