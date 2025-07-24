import { requireAuth, getUserProfile } from "@/lib/auth"
import { getSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Pill, Activity } from "lucide-react"
import { format } from "date-fns"

async function getMedicalRecords(userId: string) {
  const supabase = await getSupabaseClient()

  const { data: records } = await supabase
    .from("medical_records")
    .select(`
      *,
      doctor:doctors!medical_records_doctor_id_fkey(
        user_profiles!doctors_id_fkey(full_name)
      )
    `)
    .eq("patient_id", userId)
    .order("created_at", { ascending: false })

  return records || []
}

async function getPrescriptions(userId: string) {
  const supabase = await getSupabaseClient()

  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select(`
      *,
      doctor:doctors!prescriptions_doctor_id_fkey(
        user_profiles!doctors_id_fkey(full_name)
      )
    `)
    .eq("patient_id", userId)
    .order("created_at", { ascending: false })

  return prescriptions || []
}

export default async function RecordsPage() {
  const user = await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    return <div>Loading...</div>
  }

  const records = await getMedicalRecords(user.id)
  const prescriptions = await getPrescriptions(user.id)

  return (
    <div className="responsive-container">
      <div className="section-padding content-spacing">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <h1 className="heading-responsive text-gray-900 mb-2">Medical Records</h1>
          <p className="text-gray-600 body-responsive">Your complete health history and prescriptions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid-responsive-3 mb-8 lg:mb-12">
          <Card className="card-responsive">
            <CardContent className="p-4 lg:p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{records.length}</h3>
              <p className="text-sm text-gray-600">Medical Records</p>
            </CardContent>
          </Card>

          <Card className="card-responsive">
            <CardContent className="p-4 lg:p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Pill className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{prescriptions.length}</h3>
              <p className="text-sm text-gray-600">Prescriptions</p>
            </CardContent>
          </Card>

          <Card className="card-responsive">
            <CardContent className="p-4 lg:p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {prescriptions.filter((p) => p.status === "active").length}
              </h3>
              <p className="text-sm text-gray-600">Active Prescriptions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid-responsive-2 gap-8 lg:gap-12">
          {/* Medical Records */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="subheading-responsive">Medical Records</h2>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>

            {records.length > 0 ? (
              <div className="content-spacing">
                {records.map((record) => (
                  <Card key={record.id} className="card-responsive card-hover">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{record.record_type}</h3>
                            <p className="text-sm text-gray-600">Dr. {record.doctor?.user_profiles?.full_name}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(record.created_at), "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>

                      {record.diagnosis && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Diagnosis</h4>
                          <p className="text-sm text-gray-600">{record.diagnosis}</p>
                        </div>
                      )}

                      {record.symptoms && record.symptoms.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Symptoms</h4>
                          <div className="flex flex-wrap gap-1">
                            {record.symptoms.map((symptom: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {symptom}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {record.notes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Notes</h4>
                          <p className="text-sm text-gray-600">{record.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-responsive">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No medical records yet</h3>
                  <p className="text-gray-600 text-sm">Your medical records will appear here after consultations.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Prescriptions */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="subheading-responsive">Prescriptions</h2>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>

            {prescriptions.length > 0 ? (
              <div className="content-spacing">
                {prescriptions.map((prescription) => (
                  <Card key={prescription.id} className="card-responsive card-hover">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                            <Pill className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Dr. {prescription.doctor?.user_profiles?.full_name}
                            </h3>
                            <p className="text-sm text-gray-600">{prescription.medications.length} medication(s)</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(prescription.created_at), "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={prescription.status === "active" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {prescription.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {prescription.medications.map((medication: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{medication.name}</h4>
                              <span className="text-sm text-gray-600">{medication.dosage}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{medication.instructions}</p>
                            <p className="text-xs text-gray-500">Duration: {medication.duration}</p>
                          </div>
                        ))}
                      </div>

                      {prescription.notes && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Doctor's Notes</h4>
                          <p className="text-sm text-gray-600">{prescription.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-responsive">
                <CardContent className="p-8 text-center">
                  <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No prescriptions yet</h3>
                  <p className="text-gray-600 text-sm">Your prescriptions will appear here after consultations.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
