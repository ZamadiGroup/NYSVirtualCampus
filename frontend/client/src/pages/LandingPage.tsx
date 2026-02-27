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

const LOGO_URL = "https://pbs.twimg.com/media/BxQuYDbCYAAzxvF.jpg";
const BACKDROP_URL =
  "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=122220374816331582";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-white/15 bg-white/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_URL}
              alt="NYS Logo"
              className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-500/40"
            />
            <span className="text-xl font-bold text-slate-900">
              NYS Virtual Campus
            </span>
          </div>
          <Button
            onClick={() => onNavigate("auth")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30"
          >
            Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center hero-backdrop"
            style={{ backgroundImage: `url('${BACKDROP_URL}')` }}
          />
          <div className="absolute inset-0 bg-slate-900/45" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-emerald-600/90 px-4 py-2 text-sm font-semibold text-white shadow-lg reveal">
              National Youth Service
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Virtual Campus
            </div>
            <h1 className="mt-6 text-5xl md:text-6xl font-bold text-white drop-shadow-2xl leading-tight mb-6 reveal reveal-delay-1">
              Learn faster with NYS-led digital training
            </h1>
            <p className="text-xl text-white drop-shadow-md mb-8 leading-relaxed reveal reveal-delay-2">
              NYS Virtual Campus connects learners to expert tutors, practical
              assignments, and structured pathways that build real-world
              readiness across Kenya.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 reveal reveal-delay-3">
              <Button
                onClick={() => onNavigate("auth")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg h-12 shadow-lg shadow-emerald-600/30"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="text-lg h-12 border-white bg-white/95 hover:bg-white"
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 rounded-2xl p-8 text-white shadow-2xl h-full flex flex-col border border-white/10 reveal reveal-delay-4">
              <div className="flex justify-center mb-6">
                <img
                  src={LOGO_URL}
                  alt="NYS Logo"
                  className="h-24 w-24 object-cover bg-white/10 p-3 rounded-2xl ring-2 ring-white/30"
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
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Why Choose NYS Virtual Campus?
            </h2>
            <p className="text-xl text-slate-700">
              Everything you need for successful online learning
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all reveal reveal-delay-1">
              <CardContent className="p-8">
                <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Interactive Courses
                </h3>
                <p className="text-slate-700">
                  Engage with multimedia content, quizzes, and hands-on
                  assignments designed to enhance learning.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-blue-200 transition-all reveal reveal-delay-2">
              <CardContent className="p-8">
                <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Expert Support
                </h3>
                <p className="text-slate-700">
                  Connect with experienced tutors who provide personalized
                  guidance and real-time feedback on your work.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-purple-200 transition-all reveal reveal-delay-3">
              <CardContent className="p-8">
                <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Recognized Certificates
                </h3>
                <p className="text-slate-700">
                  Earn certificates upon course completion that are recognized
                  by educational institutions.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-orange-200 transition-all reveal reveal-delay-1">
              <CardContent className="p-8">
                <div className="p-3 bg-orange-100 rounded-lg w-fit mb-4">
                  <Globe className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Learn Anywhere
                </h3>
                <p className="text-slate-700">
                  Access courses from any device, any time. Learn at your own
                  pace with flexible scheduling.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-red-200 transition-all reveal reveal-delay-2">
              <CardContent className="p-8">
                <div className="p-3 bg-red-100 rounded-lg w-fit mb-4">
                  <BookOpen className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Rich Materials
                </h3>
                <p className="text-slate-700">
                  Access comprehensive learning materials including videos,
                  PDFs, presentations, and external resources.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all reveal reveal-delay-3">
              <CardContent className="p-8">
                <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-4">
                  <CheckCircle className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Progress Tracking
                </h3>
                <p className="text-slate-700">
                  Monitor your progress with detailed analytics and get insights
                  into your learning journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50 px-8 py-14 shadow-xl reveal">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Ready to Advance Your Learning?
            </h2>
            <p className="text-xl text-slate-700 mb-8">
              Join thousands of students who are transforming their educational
              journey with NYS Virtual Campus.
            </p>
            <Button
              onClick={() => onNavigate("auth")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg h-12 px-8 shadow-lg shadow-emerald-600/30"
            >
              Create Your Account Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950/90 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="reveal">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={LOGO_URL}
                  alt="NYS Logo"
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-emerald-500/40"
                />
                <span className="text-white font-bold">NYS Virtual Campus</span>
              </div>
              <p className="text-sm">
                Empowering learners worldwide through quality education.
              </p>
            </div>
            <div className="reveal reveal-delay-1">
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
            <div className="reveal reveal-delay-2">
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
            <div className="reveal reveal-delay-3">
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
          <div className="border-t border-white/10 pt-8">
            <p className="text-center text-sm">
              &copy; 2026 NYS Virtual Campus. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
