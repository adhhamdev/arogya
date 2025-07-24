"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, User, FileText, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { appointmentSchema } from "@/lib/validations"
import type { z } from "zod"

type AppointmentForm = z.infer<typeof appointmentSchema>

interface Doctor {
  id: string
  consultation_fee: number
  user_profiles: {
    full_name: string
  }
  specialties: {
    name: string
  }
}

export default function BookAppointmentPage({ params }: { params: { doctorId: string } }) {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
  })

  useEffect(() => {
    fetchDoctor()
  }, [params.doctorId])

  const fetchDoctor = async () => {
    const { data } = await supabase
      .from("doctors")
      .select(`
        *,
        user_profiles!doctors_id_fkey(full_name),
        specialties(name)
      `)
      .eq("id", params.doctorId)
      .single()

    if (data) {
      setDoctor(data)
    }
  }

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        slots.push(time)
      }
    }
    return slots
  }

  const generateDateOptions = () => {
    const dates = []
    const today = new Date()

    for (let i = 1; i <= 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split("T")[0])
    }

    return dates
  }

  const onSubmit = async (data: AppointmentForm) => {
    setIsLoading(true)

    try {
      const { data: user } = await supabase.auth.getUser()

      if (!user.user) {
        toast({
          title: "Error",
          description: "You must be logged in to book an appointment.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("appointments").insert({
        patient_id: user.user.id,
        doctor_id: params.doctorId,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        reason: data.reason,
        consultation_fee: doctor?.consultation_fee,
      })

      if (error) {
        toast({
          title: "Error",
          description: "Failed to book appointment. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Appointment booked successfully!",
        })
        router.push("/dashboard")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!doctor) {
    return (
      <div className="mobile-container">
        <div className="px-6 py-8 flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-container">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Appointment</h1>
          <p className="text-gray-600">Schedule your consultation with Dr. {doctor.user_profiles.full_name}</p>
        </div>

        {/* Doctor Info */}
        <Card className="card-mobile mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Dr. {doctor.user_profiles.full_name}</h3>
                <p className="text-blue-600 text-sm">{doctor.specialties.name}</p>
                <p className="text-green-600 font-medium">LKR {doctor.consultation_fee}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Date Selection */}
          <Card className="card-mobile">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Select Date</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {generateDateOptions().map((date) => (
                  <Button
                    key={date}
                    type="button"
                    variant={selectedDate === date ? "default" : "outline"}
                    className="p-4 h-auto flex flex-col rounded-2xl"
                    onClick={() => {
                      setSelectedDate(date)
                      setValue("appointment_date", date)
                    }}
                  >
                    <span className="text-sm font-medium">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </Button>
                ))}
              </div>
              {errors.appointment_date && (
                <p className="text-red-500 text-sm mt-2">{errors.appointment_date.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Time Selection */}
          <Card className="card-mobile">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Select Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {generateTimeSlots().map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={selectedTime === time ? "default" : "outline"}
                    className="p-3 rounded-2xl"
                    onClick={() => {
                      setSelectedTime(time)
                      setValue("appointment_time", time)
                    }}
                  >
                    {time}
                  </Button>
                ))}
              </div>
              {errors.appointment_time && (
                <p className="text-red-500 text-sm mt-2">{errors.appointment_time.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Reason */}
          <Card className="card-mobile">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Reason for Consultation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                {...register("reason")}
                placeholder="Please describe your symptoms or reason for consultation..."
                className="min-h-[120px] rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {errors.reason && <p className="text-red-500 text-sm mt-2">{errors.reason.message}</p>}
            </CardContent>
          </Card>

          {/* Summary */}
          {selectedDate && selectedTime && (
            <Card className="card-mobile bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Appointment Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Doctor:</span>
                    <span>Dr. {doctor.user_profiles.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{selectedTime}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Consultation Fee:</span>
                    <span>LKR {doctor.consultation_fee}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Button type="submit" className="btn-primary" disabled={isLoading || !selectedDate || !selectedTime}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              "Confirm Appointment"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
