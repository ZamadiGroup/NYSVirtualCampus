import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Users,
  Zap,
  Globe,
  Award,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import nysLogo from "@assets/generated_images/NYS_Kenya_official_logo_4530e265.png";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={nysLogo}
              alt="NYS Logo"
              className="h-12 w-12 object-contain"
            />
            <span className="text-xl font-bold text-gray-900">
              NYS Virtual Campus
            </span>
          </div>
          <Button
            onClick={() => onNavigate("auth")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Transform Your Learning Journey
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              NYS Virtual Campus connects students with expert tutors and
              comprehensive course materials. Learn at your own pace with
              interactive assignments and real-time feedback.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => onNavigate("auth")}
                className="bg-green-600 hover:bg-green-700 text-white text-lg h-12"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="text-lg h-12 border-gray-300"
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl p-8 text-white shadow-2xl h-full flex flex-col">
              <div className="flex justify-center mb-6">
                <img
                  src={nysLogo}
                  alt="NYS Logo"
                  className="h-24 w-24 object-contain bg-white/20 p-4 rounded-xl"
                />
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0" />
                  <span className="text-lg">Expert Instructors</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0" />
                  <span className="text-lg">Interactive Learning</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0" />
                  <span className="text-lg">Flexible Schedule</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0" />
                  <span className="text-lg">Real-time Feedback</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0" />
                  <span className="text-lg">Certified Courses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose NYS Virtual Campus?
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for successful online learning
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm hover:shadow-lg transition">
              <CardContent className="p-8">
                <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Interactive Courses
                </h3>
                <p className="text-gray-600">
                  Engage with multimedia content, quizzes, and hands-on
                  assignments designed to enhance learning.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition">
              <CardContent className="p-8">
                <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Expert Support
                </h3>
                <p className="text-gray-600">
                  Connect with experienced tutors who provide personalized
                  guidance and real-time feedback on your work.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition">
              <CardContent className="p-8">
                <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Recognized Certificates
                </h3>
                <p className="text-gray-600">
                  Earn certificates upon course completion that are recognized
                  by educational institutions.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition">
              <CardContent className="p-8">
                <div className="p-3 bg-orange-100 rounded-lg w-fit mb-4">
                  <Globe className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Learn Anywhere
                </h3>
                <p className="text-gray-600">
                  Access courses from any device, any time. Learn at your own
                  pace with flexible scheduling.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition">
              <CardContent className="p-8">
                <div className="p-3 bg-red-100 rounded-lg w-fit mb-4">
                  <BookOpen className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Rich Materials
                </h3>
                <p className="text-gray-600">
                  Access comprehensive learning materials including videos,
                  PDFs, presentations, and external resources.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition">
              <CardContent className="p-8">
                <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-4">
                  <CheckCircle className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Progress Tracking
                </h3>
                <p className="text-gray-600">
                  Monitor your progress with detailed analytics and get insights
                  into your learning journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <p className="text-green-100">Active Students</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <p className="text-green-100">Expert Tutors</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <p className="text-green-100">Courses</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <p className="text-green-100">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Advance Your Learning?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of students who are transforming their educational
            journey with NYS Virtual Campus.
          </p>
          <Button
            onClick={() => onNavigate("auth")}
            className="bg-green-600 hover:bg-green-700 text-white text-lg h-12 px-8"
          >
            Create Your Account Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={nysLogo}
                  alt="NYS Logo"
                  className="h-10 w-10 object-contain"
                />
                <span className="text-white font-bold">NYS Virtual Campus</span>
              </div>
              <p className="text-sm">
                Empowering learners worldwide through quality education.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Courses
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Community
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm">
              &copy; 2026 NYS Virtual Campus. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
