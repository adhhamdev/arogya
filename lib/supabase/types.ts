export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          date_of_birth: string | null
          gender: string | null
          role: "patient" | "doctor" | "admin"
          avatar_url: string | null
          language: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          role?: "patient" | "doctor" | "admin"
          avatar_url?: string | null
          language?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          role?: "patient" | "doctor" | "admin"
          avatar_url?: string | null
          language?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      doctors: {
        Row: {
          id: string
          medical_license: string
          specialty_id: string | null
          years_experience: number | null
          consultation_fee: number | null
          bio: string | null
          qualifications: string[] | null
          is_verified: boolean | null
          is_available: boolean | null
          rating: number | null
          total_reviews: number | null
          created_at: string
        }
        Insert: {
          id: string
          medical_license: string
          specialty_id?: string | null
          years_experience?: number | null
          consultation_fee?: number | null
          bio?: string | null
          qualifications?: string[] | null
          is_verified?: boolean | null
          is_available?: boolean | null
          rating?: number | null
          total_reviews?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          medical_license?: string
          specialty_id?: string | null
          years_experience?: number | null
          consultation_fee?: number | null
          bio?: string | null
          qualifications?: string[] | null
          is_verified?: boolean | null
          is_available?: boolean | null
          rating?: number | null
          total_reviews?: number | null
          created_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          blood_type: string | null
          allergies: string[] | null
          medical_conditions: string[] | null
          created_at: string
        }
        Insert: {
          id: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          blood_type?: string | null
          allergies?: string[] | null
          medical_conditions?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          blood_type?: string | null
          allergies?: string[] | null
          medical_conditions?: string[] | null
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          appointment_date: string
          appointment_time: string
          duration_minutes: number | null
          reason: string
          status: "pending" | "confirmed" | "completed" | "cancelled"
          notes: string | null
          consultation_fee: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          appointment_date: string
          appointment_time: string
          duration_minutes?: number | null
          reason: string
          status?: "pending" | "confirmed" | "completed" | "cancelled"
          notes?: string | null
          consultation_fee?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          appointment_date?: string
          appointment_time?: string
          duration_minutes?: number | null
          reason?: string
          status?: "pending" | "confirmed" | "completed" | "cancelled"
          notes?: string | null
          consultation_fee?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      prescriptions: {
        Row: {
          id: string
          appointment_id: string
          doctor_id: string
          patient_id: string
          medications: any
          instructions: string | null
          status: "active" | "completed" | "cancelled"
          valid_until: string | null
          created_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          doctor_id: string
          patient_id: string
          medications: any
          instructions?: string | null
          status?: "active" | "completed" | "cancelled"
          valid_until?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          doctor_id?: string
          patient_id?: string
          medications?: any
          instructions?: string | null
          status?: "active" | "completed" | "cancelled"
          valid_until?: string | null
          created_at?: string
        }
      }
      medical_records: {
        Row: {
          id: string
          patient_id: string
          title: string
          description: string | null
          file_url: string | null
          file_type: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          title: string
          description?: string | null
          file_url?: string | null
          file_type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          title?: string
          description?: string | null
          file_url?: string | null
          file_type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      specialties: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      doctor_availability: {
        Row: {
          id: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean | null
          created_at?: string
        }
      }
    }
  }
}

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]
export type Doctor = Database["public"]["Tables"]["doctors"]["Row"]
export type Patient = Database["public"]["Tables"]["patients"]["Row"]
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"]
export type Prescription = Database["public"]["Tables"]["prescriptions"]["Row"]
export type MedicalRecord = Database["public"]["Tables"]["medical_records"]["Row"]
export type Specialty = Database["public"]["Tables"]["specialties"]["Row"]
