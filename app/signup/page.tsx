"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Loader2, Stethoscope, Eye, EyeOff, User, Phone } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"

const signupSchema = z
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

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const selectedRole = watch("role")

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: data.fullName,
            role: data.role,
            phone: data.phone,
            date_of_birth: data.dateOfBirth,
            gender: data.gender,
          },
        },
      })

      if (authError) {
        toast({
          title: "Error",
          description: authError.message,
          variant: "destructive",
        })
        return
      }

      if (authData.user && !authData.user.email_confirmed_at) {
        setEmailSent(true)
        toast({
          title: "Check your email",
          description:
            "We sent you a confirmation link. Please check your email and click the link to verify your account.",
        })
      } else if (authData.user && authData.user.email_confirmed_at) {
        // User is already confirmed, redirect to dashboard
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

  const signUpWithGoogle = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
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

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="responsive-container">
          <div className="section-padding">
            <div className="max-w-md mx-auto text-center">
              <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Check Your Email</h1>
              <p className="text-gray-600 body-responsive mb-8">
                We've sent a verification link to your email address. Please click the link to verify your account and
                complete the registration process.
              </p>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button onClick={() => setEmailSent(false)} className="text-blue-600 hover:underline font-medium">
                    try again
                  </button>
                </p>
                <Link href="/login">
                  <Button variant="outline" className="btn-secondary bg-transparent">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
      <div className="responsive-container">
        <div className="section-padding">
          <div className="max-w-md mx-auto">
            {/* Logo and Header */}
            <div className="text-center mb-8 lg:mb-12">
              <Link href="/" className="inline-block">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 lg:mb-8">
                  <Stethoscope className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                </div>
              </Link>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
              <p className="text-gray-600 body-responsive">Join Arogya to access quality healthcare</p>
            </div>

            {/* Signup Form */}
            <Card className="card-responsive mb-6">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl lg:text-2xl">Sign Up</CardTitle>
                <CardDescription className="body-responsive">Create your account to get started</CardDescription>
              </CardHeader>
              <CardContent className="content-spacing">
                <form onSubmit={handleSubmit(onSubmit)} className="form-responsive">
                  {/* Role Selection */}
                  <div className="form-group-responsive">
                    <Label htmlFor="role">I am a</Label>
                    <Select onValueChange={(value) => setValue("role", value as "patient" | "doctor")}>
                      <SelectTrigger className="input-responsive">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.role && <p className="text-red-500 text-sm mt-2">{errors.role.message}</p>}
                  </div>

                  {/* Full Name */}
                  <div className="form-group-responsive">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        {...register("fullName")}
                        id="fullName"
                        placeholder="Enter your full name"
                        className="input-responsive pl-12"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.fullName && <p className="text-red-500 text-sm mt-2">{errors.fullName.message}</p>}
                  </div>

                  {/* Email */}
                  <div className="form-group-responsive">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        {...register("email")}
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="input-responsive pl-12"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email.message}</p>}
                  </div>

                  {/* Phone (Optional) */}
                  <div className="form-group-responsive">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        {...register("phone")}
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        className="input-responsive pl-12"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="form-group-responsive">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        {...register("password")}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        className="input-responsive pr-12"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-sm mt-2">{errors.password.message}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="form-group-responsive">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        {...register("confirmPassword")}
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="input-responsive pr-12"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-2">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* Additional Fields for Patients */}
                  {selectedRole === "patient" && (
                    <>
                      <div className="grid-responsive-2">
                        <div className="form-group-responsive">
                          <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
                          <Input
                            {...register("dateOfBirth")}
                            id="dateOfBirth"
                            type="date"
                            className="input-responsive"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="form-group-responsive">
                          <Label htmlFor="gender">Gender (Optional)</Label>
                          <Select onValueChange={(value) => setValue("gender", value as "male" | "female" | "other")}>
                            <SelectTrigger className="input-responsive">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Terms and Conditions */}
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>
                    </label>
                  </div>

                  <Button type="submit" className="btn-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <Button
                  onClick={signUpWithGoogle}
                  variant="outline"
                  className="btn-secondary bg-transparent"
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-gray-500">
              <p>
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
