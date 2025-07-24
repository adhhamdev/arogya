import Link from "next/link"
import { Heart, Shield, Clock, Users, ArrowRight, Stethoscope } from "lucide-react"

export default function HomePage() {
  const features = [
    {
      icon: Stethoscope,
      title: "Expert Doctors",
      description: "Connect with verified medical professionals across Sri Lanka",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your health data is protected with end-to-end encryption",
    },
    {
      icon: Clock,
      title: "24/7 Available",
      description: "Get medical consultation anytime, anywhere",
    },
    {
      icon: Users,
      title: "Trusted Platform",
      description: "Join thousands of patients who trust Arogya for their healthcare",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="responsive-container">
        <div className="section-padding">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="heading-responsive text-gray-900 mb-6">
              Your Health, <br />
              <span className="text-blue-600">Our Priority</span>
            </h1>
            <p className="body-responsive text-gray-600 mb-8 max-w-2xl mx-auto">
              Connect with verified doctors across Sri Lanka for online consultations. Get expert medical advice from
              the comfort of your home.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Link href="/login" className="btn-primary flex items-center justify-center">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="/doctors" className="btn-secondary flex items-center justify-center">
                Find Doctors
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-16">
            <h2 className="subheading-responsive text-center text-gray-900 mb-12">Why Choose Arogya?</h2>
            <div className="grid-responsive-2 lg:grid-cols-4">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="card-responsive text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stats Section */}
          <div className="card-responsive mb-16">
            <div className="text-center mb-8">
              <h2 className="subheading-responsive text-gray-900 mb-4">Trusted by Thousands</h2>
              <p className="text-gray-600">Join our growing community of patients and doctors</p>
            </div>

            <div className="grid-responsive-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                <div className="text-gray-600">Verified Doctors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">10K+</div>
                <div className="text-gray-600">Happy Patients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">25K+</div>
                <div className="text-gray-600">Consultations</div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="card-responsive bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-blue-100 mb-8">Join Arogya today and experience healthcare like never before</p>
              <Link
                href="/login"
                className="inline-flex items-center bg-white text-blue-600 font-semibold py-3 px-8 rounded-2xl hover:bg-gray-100 transition-colors"
              >
                Sign Up Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
