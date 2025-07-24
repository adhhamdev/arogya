import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    phone: z.string().optional(),
    role: z.enum(["patient", "doctor"], {
      required_error: "Please select your role",
    }),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  language: z.enum(["en", "si", "ta"]).default("en"),
})

export const appointmentSchema = z.object({
  doctor_id: z.string().uuid(),
  appointment_date: z.string(),
  appointment_time: z.string(),
  reason: z.string().min(10, "Please provide more details about your reason for consultation"),
})

export const prescriptionSchema = z.object({
  medications: z
    .array(
      z.object({
        name: z.string().min(1, "Medication name is required"),
        dosage: z.string().min(1, "Dosage is required"),
        frequency: z.string().min(1, "Frequency is required"),
        duration: z.string().min(1, "Duration is required"),
      }),
    )
    .min(1, "At least one medication is required"),
  instructions: z.string().optional(),
  valid_until: z.string().optional(),
})

export const doctorProfileSchema = z.object({
  medical_license: z.string().min(1, "Medical license is required"),
  specialty_id: z.string().uuid().optional(),
  years_experience: z.number().min(0).optional(),
  consultation_fee: z.number().min(0).optional(),
  bio: z.string().optional(),
  qualifications: z.array(z.string()).optional(),
})

export const patientProfileSchema = z.object({
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  blood_type: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medical_conditions: z.array(z.string()).optional(),
})
