import { requireDoctor } from "@/lib/auth"
import { getSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { User, Stethoscope, Award, DollarSign, FileText, Bell, Shield, LogOut } from "lucide-react"

async function getDoctorProfile(doctorId: string) {
  const supabase = await getSupabaseClient()

  const { data: doctor } = await supabase
    .from("doctors")
    .select(`
      *,
      user_profiles!doctors_id_fkey(*),
      specialties(*)
    `)
    .eq("id", doctorId)
    .single()

  return doctor
}

async function getSpecialties() {
  const supabase = await getSupabaseClient()
  const { data: specialties } = await supabase.from("specialties").select("*").order("name")
  return specialties || []
}

export default async function DoctorSettingsPage() {
  const profile = await requireDoctor()
  const doctor = await getDoctorProfile(profile.id)
  const specialties = await getSpecialties()

  return (
    <div className="responsive-container">
      <div className="section-padding content-spacing">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <h1 className="heading-responsive text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600 body-responsive">Manage your profile and practice preferences</p>
        </div>

        <div className="grid-responsive-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="card-responsive">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid-responsive-2">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" defaultValue={doctor?.user_profiles?.full_name} className="input-responsive" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={doctor?.user_profiles?.email}
                      className="input-responsive"
                      disabled
                    />
                  </div>
                </div>

                <div className="grid-responsive-2">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue={doctor?.user_profiles?.phone || ""} className="input-responsive" />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      defaultValue={doctor?.user_profiles?.date_of_birth || ""}
                      className="input-responsive"
                    />
                  </div>
                </div>

                <Button className="btn-primary bg-green-500 hover:bg-green-600">Save Changes</Button>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card className="card-responsive">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Stethoscope className="w-5 h-5 mr-2" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid-responsive-2">
                  <div>
                    <Label htmlFor="medicalLicense">Medical License</Label>
                    <Input id="medicalLicense" defaultValue={doctor?.medical_license} className="input-responsive" />
                  </div>
                  <div>
                    <Label htmlFor="specialty">Specialty</Label>
                    <Select defaultValue={doctor?.specialty_id || ""}>
                      <SelectTrigger className="input-responsive">
                        <SelectValue placeholder="Select specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty.id} value={specialty.id}>
                            {specialty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid-responsive-2">
                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      defaultValue={doctor?.years_experience || ""}
                      className="input-responsive"
                    />
                  </div>
                  <div>
                    <Label htmlFor="consultationFee">Consultation Fee (LKR)</Label>
                    <Input
                      id="consultationFee"
                      type="number"
                      defaultValue={doctor?.consultation_fee || ""}
                      className="input-responsive"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    defaultValue={doctor?.bio || ""}
                    placeholder="Tell patients about your experience and approach to healthcare..."
                    className="min-h-[120px] rounded-2xl border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <Label htmlFor="qualifications">Qualifications</Label>
                  <Textarea
                    id="qualifications"
                    defaultValue={doctor?.qualifications?.join("\n") || ""}
                    placeholder="Enter each qualification on a new line..."
                    className="min-h-[100px] rounded-2xl border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <Button className="btn-primary bg-green-500 hover:bg-green-600">Update Profile</Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="card-responsive">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">New Appointment Requests</h4>
                    <p className="text-sm text-gray-600">Get notified when patients book appointments</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-green-600" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Appointment Reminders</h4>
                    <p className="text-sm text-gray-600">Reminders for upcoming consultations</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-green-600" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Patient Messages</h4>
                    <p className="text-sm text-gray-600">Notifications for patient inquiries</p>
                  </div>
                  <input type="checkbox" className="w-4 h-4 text-green-600" />
                </div>

                <Button className="btn-primary bg-green-500 hover:bg-green-600">Update Preferences</Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="card-responsive">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Change Password</h4>
                    <p className="text-sm text-gray-600">Update your account password</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Export Patient Data</h4>
                    <p className="text-sm text-gray-600">Download your practice data</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Summary */}
          <div className="space-y-6">
            <Card className="card-responsive">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">
                    {doctor?.user_profiles?.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1">Dr. {doctor?.user_profiles?.full_name}</h3>
                <p className="text-green-600 font-medium mb-2">{doctor?.specialties?.name}</p>
                <div className="flex items-center justify-center mb-4">
                  <Badge
                    variant={doctor?.is_verified ? "default" : "secondary"}
                    className="bg-green-100 text-green-800"
                  >
                    {doctor?.is_verified ? "Verified" : "Pending Verification"}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-center">
                    <Award className="w-4 h-4 mr-2" />
                    {doctor?.years_experience || 0} years experience
                  </div>
                  <div className="flex items-center justify-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    LKR {doctor?.consultation_fee || 0} consultation
                  </div>
                  <div className="flex items-center justify-center">
                    <FileText className="w-4 h-4 mr-2" />
                    License: {doctor?.medical_license}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-responsive">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Shield className="w-4 h-4 mr-2" />
                  Privacy Settings
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Bell className="w-4 h-4 mr-2" />
                  Notification Center
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="w-4 h-4 mr-2" />
                  Practice Analytics
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
