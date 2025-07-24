import { requireDoctor } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Activity, Star } from "lucide-react"

export default async function DoctorAnalyticsPage() {
  const profile = await requireDoctor()

  // Mock analytics data - in real app, this would come from database
  const analyticsData = {
    monthlyStats: {
      totalAppointments: 45,
      completedAppointments: 42,
      totalRevenue: 126000,
      averageRating: 4.8,
      newPatients: 12,
      returningPatients: 30,
    },
    weeklyTrends: [
      { day: "Mon", appointments: 8, revenue: 24000 },
      { day: "Tue", appointments: 6, revenue: 18000 },
      { day: "Wed", appointments: 7, revenue: 21000 },
      { day: "Thu", appointments: 9, revenue: 27000 },
      { day: "Fri", appointments: 5, revenue: 15000 },
      { day: "Sat", appointments: 4, revenue: 12000 },
      { day: "Sun", appointments: 3, revenue: 9000 },
    ],
    topConditions: [
      { condition: "General Consultation", count: 15, percentage: 33 },
      { condition: "Hypertension", count: 8, percentage: 18 },
      { condition: "Diabetes", count: 6, percentage: 13 },
      { condition: "Respiratory Issues", count: 5, percentage: 11 },
      { condition: "Others", count: 11, percentage: 25 },
    ],
  }

  const stats = [
    {
      title: "Total Appointments",
      value: analyticsData.monthlyStats.totalAppointments.toString(),
      change: "+12%",
      icon: Calendar,
      color: "bg-blue-100 text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Monthly Revenue",
      value: `LKR ${analyticsData.monthlyStats.totalRevenue.toLocaleString()}`,
      change: "+8%",
      icon: DollarSign,
      color: "bg-green-100 text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Patient Rating",
      value: analyticsData.monthlyStats.averageRating.toString(),
      change: "+0.2",
      icon: Star,
      color: "bg-yellow-100 text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "New Patients",
      value: analyticsData.monthlyStats.newPatients.toString(),
      change: "+25%",
      icon: Users,
      color: "bg-purple-100 text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  return (
    <div className="responsive-container">
      <div className="section-padding content-spacing">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <h1 className="heading-responsive text-gray-900 mb-2">Practice Analytics</h1>
          <p className="text-gray-600 body-responsive">Track your practice performance and patient insights</p>
        </div>

        {/* Key Metrics */}
        <div className="mb-8 lg:mb-12">
          <h2 className="subheading-responsive text-gray-900 mb-4 lg:mb-6">This Month's Performance</h2>
          <div className="grid-responsive-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index} className={`card-responsive ${stat.bgColor}`}>
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-green-600">{stat.change}</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="grid-responsive-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Weekly Trends */}
          <div className="lg:col-span-2">
            <Card className="card-responsive">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Weekly Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.weeklyTrends.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 text-sm font-medium text-gray-900">{day.day}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${(day.appointments / 10) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{day.appointments} appointments</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">LKR {day.revenue.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Patient Demographics */}
            <Card className="card-responsive">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Patient Demographics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid-responsive-2">
                  <div className="text-center p-4 bg-blue-50 rounded-2xl">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {analyticsData.monthlyStats.newPatients}
                    </div>
                    <div className="text-sm text-gray-600">New Patients</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-2xl">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {analyticsData.monthlyStats.returningPatients}
                    </div>
                    <div className="text-sm text-gray-600">Returning Patients</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Conditions */}
          <div>
            <Card className="card-responsive">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Top Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topConditions.map((condition, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{condition.condition}</span>
                        <span className="text-sm text-gray-600">{condition.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${condition.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="card-responsive">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="text-sm font-medium text-gray-900">93%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Session</span>
                  <span className="text-sm font-medium text-gray-900">25 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-sm font-medium text-gray-900">&lt; 2 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Patient Satisfaction</span>
                  <span className="text-sm font-medium text-gray-900">4.8/5.0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
