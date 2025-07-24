import { requireDoctor } from "@/lib/auth"
import { getSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, Search, Phone, Mail, Users } from "lucide-react"
import { Input } from "@/components/ui/input"

export default async function DoctorPatients() {
  const doctorProfile = await requireDoctor()
  const supabase = await getSupabaseClient()

  // Fetch patients who have had appointments with this doctor
  const { data: patients } = await supabase
    .from("appointments")
    .select("patient:user_profiles!patient_id(*)")
    .eq("doctor_id", doctorProfile.id)
    .order("created_at", { ascending: false })

  // Remove duplicates (patients with multiple appointments)
  const uniquePatients = patients
    ? Array.from(new Map(patients.map((item) => [item.patient.id, item.patient])).values())
    : []

  // Fetch appointment counts for each patient
  const patientAppointmentCounts: Record<string, number> = {}
  if (uniquePatients.length > 0) {
    for (const patient of uniquePatients) {
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", doctorProfile.id)
        .eq("patient_id", patient.id)

      patientAppointmentCounts[patient.id] = count || 0
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
        <p className="text-muted-foreground">Manage your patients and their medical records.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search patients..."
            className="w-full bg-white pl-8 shadow-none md:w-[300px] lg:w-[400px]"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto bg-transparent">
            Filter
          </Button>
          <Button className="w-full sm:w-auto">Add Patient</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Patients</CardTitle>
          <CardDescription>
            {uniquePatients.length} {uniquePatients.length === 1 ? "patient" : "patients"} under your care
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uniquePatients.length > 0 ? (
            <div className="space-y-6">
              {uniquePatients.map((patient) => (
                <div key={patient.id} className="flex flex-col md:flex-row gap-4 rounded-md border p-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={patient.avatar_url || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-800">
                        {patient.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <p className="font-medium">{patient.full_name}</p>
                        <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">Patient</Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 gap-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {patient.date_of_birth
                            ? new Date(patient.date_of_birth).toLocaleDateString()
                            : "No DOB recorded"}
                        </div>
                        <div className="flex items-center">
                          <Badge variant="outline" className="font-normal">
                            {patientAppointmentCounts[patient.id] || 0}{" "}
                            {patientAppointmentCounts[patient.id] === 1 ? "visit" : "visits"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-y-1 gap-x-4 text-sm">
                        <div className="flex items-center">
                          <Phone className="mr-1 h-3 w-3 text-muted-foreground" />
                          <span>{patient.phone || "No phone"}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="mr-1 h-3 w-3 text-muted-foreground" />
                          <span>{patient.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:ml-auto">
                    <Button size="sm" variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Medical Records
                    </Button>
                    <Button size="sm" variant="default">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Appointment
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="font-medium text-lg">No patients yet</h3>
              <p className="text-sm text-muted-foreground">
                Patients will appear here after their first appointment with you
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
