import { getSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Clock, Award, Calendar } from "lucide-react"
import Link from "next/link"
import { requireAuth } from "@/lib/auth"
import { notFound } from "next/navigation"

async function getDoctor(id: string) {
  const supabase = await getSupabaseClient()

  const { data } = await supabase
    .from("doctors")
    .select(`
      *,
      user_profiles!doctors_id_fkey(full_name, avatar_url),
      specialties(name, description)
    `)
    .eq("id", id)
    .eq("is_verified", true)
    .single()

  return data
}

async function getDoctorAvailability(doctorId: string) {
  const supabase = await createServerClient()

  const { data } = await supabase
    .from("doctor_availability")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("is_available", true)
    .order("day_of_week")

  return data || []
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default async function DoctorDetailPage({ params }: { params: { id: string } }) {
  await requireAuth()

  const doctor = await getDoctor(params.id)

  if (!doctor) {
    notFound()
  }

  const availability = await getDoctorAvailability(params.id)

  return (
    <div className="mobile-container">
      <div className="px-6 py-8">
        {/* Doctor Profile */}
        <Card className="card-mobile mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center">
                {doctor.user_profiles?.avatar_url ? (
                  <img
                    src={doctor.user_profiles.avatar_url || "/placeholder.svg"}
                    alt={doctor.user_profiles?.full_name}
                    className="w-20 h-20 rounded-3xl object-cover"
                  />
                ) : (
                  <span className="text-blue-600 font-semibold text-2xl">
                    {doctor.user_profiles?.full_name?.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Dr. {doctor.user_profiles?.full_name}</h1>
                <p className="text-blue-600 font-medium mb-2">{doctor.specialties?.name}</p>

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-medium">{doctor.rating?.toFixed(1) || "0.0"}</span>
                    <span>({doctor.total_reviews} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-2xl">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-xl mx-auto mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Experience</p>
                <p className="font-semibold">{doctor.years_experience} years</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-2xl">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-xl mx-auto mb-2">
                  <Award className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Consultation</p>
                <p className="font-semibold">LKR {doctor.consultation_fee}</p>
              </div>
            </div>

            {/* Bio */}
            {doctor.bio && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{doctor.bio}</p>
              </div>
            )}

            {/* Qualifications */}
            {doctor.qualifications && doctor.qualifications.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Qualifications</h3>
                <div className="space-y-2">
                  {doctor.qualifications.map((qualification, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm text-gray-600">{qualification}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Availability */}
        <Card className="card-mobile mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Availability</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availability.length > 0 ? (
              <div className="space-y-3">
                {availability.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between py-2">
                    <span className="font-medium">{DAYS[slot.day_of_week]}</span>
                    <span className="text-sm text-gray-600">
                      {slot.start_time} - {slot.end_time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Availability information not provided.</p>
            )}
          </CardContent>
        </Card>

        {/* Specialty Info */}
        {doctor.specialties?.description && (
          <Card className="card-mobile mb-8">
            <CardHeader>
              <CardTitle>{doctor.specialties.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm leading-relaxed">{doctor.specialties.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Book Appointment Button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
          <div className="max-w-md mx-auto">
            <Link href={`/book/${doctor.id}`}>
              <Button className="btn-primary">Book Appointment - LKR {doctor.consultation_fee}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
