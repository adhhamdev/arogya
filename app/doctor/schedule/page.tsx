import { requireDoctor } from "@/lib/auth"
import { getSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Plus, Save, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function DoctorSchedule() {
  const doctorProfile = await requireDoctor()
  const supabase = await getSupabaseClient()

  // Fetch doctor's availability
  const { data: availability } = await supabase
    .from("doctor_availability")
    .select("*")
    .eq("doctor_id", doctorProfile.id)
    .order("day_of_week", { ascending: true })

  // Group availability by day
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const availabilityByDay: Record<string, any[]> = {}

  daysOfWeek.forEach((day) => {
    availabilityByDay[day] = []
  })

  if (availability) {
    availability.forEach((slot) => {
      const day = daysOfWeek[slot.day_of_week - 1]
      if (availabilityByDay[day]) {
        availabilityByDay[day].push(slot)
      }
    })
  }

  // Format time for display
  const formatTime = (timeStr: string) => {
    const time = new Date(`2000-01-01T${timeStr}`)
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Schedule Management</h1>
        <p className="text-muted-foreground">Set your availability and manage your working hours.</p>
      </div>

      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="templates">Schedule Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Weekly Availability</CardTitle>
                <CardDescription>Set your regular working hours for each day of the week.</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Time Slot
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {daysOfWeek.map((day) => (
                  <div key={day} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{day}</h3>
                      {availabilityByDay[day].length === 0 && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not Available
                        </Badge>
                      )}
                    </div>
                    {availabilityByDay[day].length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {availabilityByDay[day].map((slot, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-md border p-3 text-sm"
                          >
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span>
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Hours
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Templates</CardTitle>
              <CardDescription>Create and manage reusable schedule templates.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6 h-[180px]">
                  <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="font-medium">Create New Template</p>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    Save time by creating reusable schedule templates
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium">Regular Hours</h3>
                      <p className="text-sm text-muted-foreground">Mon-Fri, 9am-5pm</p>
                    </div>
                    <Badge>Default</Badge>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 5:00 PM</span>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button size="sm">Apply</Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium">Evening Hours</h3>
                      <p className="text-sm text-muted-foreground">Mon-Thu, 4pm-8pm</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm flex justify-between">
                      <span>Monday - Thursday</span>
                      <span>4:00 PM - 8:00 PM</span>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button size="sm">Apply</Button>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    )
}
