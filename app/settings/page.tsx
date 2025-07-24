import { requireAuth, getUserProfile } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Phone, Mail, Calendar, Shield, Bell, LogOut } from "lucide-react"

export default async function SettingsPage() {
  const user = await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    return <div>Loading...</div>
  }

  return (
    <div className="responsive-container">
      <div className="section-padding content-spacing">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <h1 className="heading-responsive text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600 body-responsive">Manage your account and preferences</p>
        </div>

        <div className="grid-responsive-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="card-responsive">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid-responsive-2">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" defaultValue={profile.full_name} className="input-responsive" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user.email} className="input-responsive" disabled />
                  </div>
                </div>

                <div className="grid-responsive-2">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue={profile.phone_number || ""} className="input-responsive" />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      defaultValue={profile.date_of_birth || ""}
                      className="input-responsive"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" defaultValue={profile.address || ""} className="input-responsive" />
                </div>

                <Button className="btn-primary">Save Changes</Button>
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
                    <h4 className="font-medium">Appointment Reminders</h4>
                    <p className="text-sm text-gray-600">Get notified about upcoming appointments</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Prescription Updates</h4>
                    <p className="text-sm text-gray-600">Notifications about prescription renewals</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Health Tips</h4>
                    <p className="text-sm text-gray-600">Receive health tips and wellness advice</p>
                  </div>
                  <input type="checkbox" className="w-4 h-4 text-blue-600" />
                </div>

                <Button className="btn-primary">Update Preferences</Button>
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
                    <h4 className="font-medium">Download My Data</h4>
                    <p className="text-sm text-gray-600">Export your medical records and data</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Summary */}
          <div className="space-y-6">
            <Card className="card-responsive">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{profile.full_name}</h3>
                <Badge variant="secondary" className="mb-4 capitalize">
                  {profile.role}
                </Badge>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {user.email}
                  </div>
                  {profile.phone_number && (
                    <div className="flex items-center justify-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {profile.phone_number}
                    </div>
                  )}
                  <div className="flex items-center justify-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Joined {new Date(profile.created_at).toLocaleDateString()}
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
