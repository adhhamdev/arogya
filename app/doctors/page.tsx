import { requireAuth, getUserProfile } from "@/lib/auth"
import { getSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Star, Clock, Filter, User } from "lucide-react"
import Link from "next/link"

async function getDoctors() {
  const supabase = await getSupabaseClient()

  const { data: doctors } = await supabase
    .from("doctors")
    .select(`
      *,
      user_profiles!doctors_id_fkey(
        full_name,
        phone_number
      )
    `)
    .eq("is_verified", true)
    .eq("is_available", true)
    .order("created_at", { ascending: false })

  return doctors || []
}

export default async function DoctorsPage() {
  await requireAuth()
  const profile = await getUserProfile()
  const doctors = await getDoctors()

  return (
    <div className="responsive-container">
      <div className="section-padding content-spacing">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <h1 className="heading-responsive text-gray-900 mb-2">Find Doctors</h1>
          <p className="text-gray-600 body-responsive">Connect with verified medical professionals</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 lg:mb-12">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input placeholder="Search doctors by name or specialization..." className="input-responsive pl-12" />
            </div>
            <Button variant="outline" className="btn-secondary flex items-center bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Specialization Tags */}
          <div className="flex flex-wrap gap-2">
            {["General Medicine", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics"].map((spec) => (
              <Badge key={spec} variant="secondary" className="cursor-pointer hover:bg-blue-100">
                {spec}
              </Badge>
            ))}
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid-responsive-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="card-responsive card-hover">
              <CardContent className="p-4 lg:p-6">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <User className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">Dr. {doctor.user_profiles?.full_name}</h3>
                  <p className="text-blue-600 font-medium mb-2">{doctor.specialization}</p>

                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span>{doctor.rating || "4.8"}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{doctor.experience_years}+ years</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{doctor.location}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 justify-center mb-4">
                    {doctor.languages?.slice(0, 3).map((lang: string) => (
                      <Badge key={lang} variant="outline" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">Rs. {doctor.consultation_fee}</p>
                    <p className="text-sm text-gray-600">Consultation Fee</p>
                  </div>

                  <Link href={`/doctors/${doctor.id}`}>
                    <Button className="btn-primary">View Profile</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {doctors.length === 0 && (
          <Card className="card-responsive">
            <CardContent className="p-8 lg:p-12 text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No doctors found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or check back later.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
