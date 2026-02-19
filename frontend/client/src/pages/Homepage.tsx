import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  Calendar,
  Bell,
  TrendingUp,
  Award,
  Clock,
  FileText,
  GraduationCap,
  BarChart3,
  MessageSquare,
  Settings,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { coursesApi, assignmentsApi, submissionsApi } from "@/lib/api";
import { parseJwt } from "@/lib/auth";

interface HomepageProps {
  userRole: "student" | "tutor" | "admin";
  userName: string;
  onNavigate: (page: string) => void;
}

export default function Homepage({
  userRole,
  userName,
  onNavigate,
}: HomepageProps) {
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAssignments, setPendingAssignments] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    if (userRole !== "student") return;
    let mounted = true;
    const fetchCourses = async () => {
      try {
        const res = await coursesApi.getMyEnrollments();
        if (!mounted) return;
        if (Array.isArray(res)) {
          const courses = res.slice(0, 3); // Show only 3 courses
          setEnrolledCourses(courses);

          // Calculate overall progress (average of all enrolled courses)
          if (res.length > 0) {
            const avgProgress =
              res.reduce((sum: number, c: any) => sum + (c.progress || 0), 0) /
              res.length;
            setOverallProgress(Math.round(avgProgress));
          }

          // Fetch all assignments for enrolled courses and calculate pending
          const token = localStorage.getItem("token");
          if (token) {
            const decoded = parseJwt(token);
            const userId = decoded?.userId;

            if (userId && res.length > 0) {
              // Get all assignments for all enrolled courses
              const allAssignments: any[] = [];
              for (const course of res) {
                try {
                  const courseAssignments = await assignmentsApi.getAll(
                    String((course as any)._id || course.id),
                  );
                  if (Array.isArray(courseAssignments)) {
                    allAssignments.push(...courseAssignments);
                  }
                } catch (e) {
                  console.warn("Failed to fetch assignments for course", e);
                }
              }

              // Get all submissions for this student
              try {
                const submissions = await submissionsApi.getAll({
                  studentId: userId,
                });
                const submittedAssignmentIds = new Set(
                  Array.isArray(submissions)
                    ? submissions.map((s: any) => s.assignmentId)
                    : [],
                );

                // Count pending assignments (not submitted yet)
                const pending = allAssignments.filter(
                  (a: any) => !submittedAssignmentIds.has(a.id || a._id),
                ).length;

                setPendingAssignments(pending);
              } catch (e) {
                console.warn("Failed to fetch submissions", e);
              }
            }
          }
        }
      } catch (e) {
        console.warn("Failed to load courses", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCourses();
    return () => {
      mounted = false;
    };
  }, [userRole]);

  // Student Home Page
  if (userRole === "student") {
    return (
      <div className="space-y-6">
        {/* Welcome Hero Section */}
        <div className="bg-gradient-to-r from-green-600 via-green-500 to-green-400 rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {userName}! 👋
              </h1>
              <p className="text-green-100 text-lg">
                Continue your learning journey with NYS Virtual Campus
              </p>
            </div>
            <div className="text-6xl opacity-20">📚</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm hover:shadow-md transition">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Active Courses
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {enrolledCourses.length}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <BookOpen className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Pending Assignments
                      </p>
                      <p className="text-3xl font-bold text-orange-600">
                        {pendingAssignments}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Overall Progress
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {overallProgress}%
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Materials
                      </p>
                      <p className="text-3xl font-bold text-purple-600">
                        {enrolledCourses.reduce(
                          (sum, c) =>
                            sum +
                            (c.chapters?.reduce(
                              (chSum: number, ch: any) =>
                                chSum + (ch.materials?.length || 0),
                              0,
                            ) || 0),
                          0,
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* My Courses */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm h-full">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    My Courses
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate("courses")}
                    className="text-green-600 hover:text-green-700"
                  >
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 bg-gray-100 rounded animate-pulse"
                      />
                    ))}
                  </div>
                ) : enrolledCourses.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No courses yet</p>
                    <Button
                      onClick={() => onNavigate("courses")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Explore Courses
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrolledCourses.map((course) => (
                      <div
                        key={course.id}
                        className="p-4 border rounded-lg hover:bg-green-50 transition cursor-pointer group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-green-600">
                              {course.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {course.department}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {course.progress || 0}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-green-50 hover:border-green-300"
                onClick={() => onNavigate("dashboard")}
              >
                <BarChart3 className="h-4 w-4 mr-2 text-green-600" />
                My Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-orange-50 hover:border-orange-300"
                onClick={() => onNavigate("assignments")}
              >
                <FileText className="h-4 w-4 mr-2 text-orange-600" />
                Assignments
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-green-50 hover:border-green-300"
                onClick={() => onNavigate("courses")}
              >
                <BookOpen className="h-4 w-4 mr-2 text-green-600" />
                Browse Courses
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-yellow-50 hover:border-yellow-300"
                onClick={() => onNavigate("announcements")}
              >
                <Bell className="h-4 w-4 mr-2 text-yellow-600" />
                Announcements
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Announcements & Updates */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-4 border-l-4 border-orange-500 bg-orange-50 rounded">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      Assignment Due Soon
                    </h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Your Web Development assignment is due in 2 days. Make
                      sure to submit before the deadline.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">2 hours ago</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      New Course Available
                    </h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Check out our new Advanced Python course. Limited spots
                      available!
                    </p>
                    <p className="text-xs text-gray-500 mt-2">1 day ago</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      Grade Posted
                    </h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Your grade for the Math 101 midterm has been posted. You
                      scored 92%!
                    </p>
                    <p className="text-xs text-gray-500 mt-2">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4 text-green-600 hover:text-green-700"
              onClick={() => onNavigate("announcements")}
            >
              View All Announcements <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Original logic for tutor/admin (unchanged)
  const getWelcomeMessage = () => {
    switch (userRole) {
      case "tutor":
        return `Welcome, ${userName}! Manage your courses and students effectively.`;
      case "admin":
        return `Welcome, ${userName}! Oversee the virtual campus operations.`;
      default:
        return `Welcome to NYS Virtual Campus!`;
    }
  };

  const getQuickActions = () => {
    switch (userRole) {
      case "tutor":
        return [
          {
            title: "My Courses",
            icon: GraduationCap,
            page: "courses",
            color: "bg-green-500",
          },
          {
            title: "Students",
            icon: Users,
            page: "students",
            color: "bg-green-500",
          },
          {
            title: "Assignments",
            icon: FileText,
            page: "assignments",
            color: "bg-yellow-500",
          },
          {
            title: "Analytics",
            icon: BarChart3,
            page: "analytics",
            color: "bg-purple-500",
          },
        ];
      case "admin":
        return [
          { title: "Users", icon: Users, page: "users", color: "bg-green-500" },
          {
            title: "Courses",
            icon: BookOpen,
            page: "courses",
            color: "bg-green-500",
          },
          {
            title: "Analytics",
            icon: BarChart3,
            page: "analytics",
            color: "bg-yellow-500",
          },
          {
            title: "Settings",
            icon: Settings,
            page: "settings",
            color: "bg-purple-500",
          },
        ];
      default:
        return [];
    }
  };

  const getRecentActivity = () => {
    switch (userRole) {
      case "tutor":
        return [
          {
            title: "3 new submissions received",
            time: "1 hour ago",
            type: "submission",
          },
          {
            title: "Student question in Discussion Forum",
            time: "3 hours ago",
            type: "question",
          },
          {
            title: "Course enrollment increased",
            time: "1 day ago",
            type: "enrollment",
          },
        ];
      case "admin":
        return [
          {
            title: "5 new user registrations",
            time: "2 hours ago",
            type: "registration",
          },
          {
            title: "System maintenance completed",
            time: "1 day ago",
            type: "maintenance",
          },
          {
            title: "Backup process successful",
            time: "2 days ago",
            type: "backup",
          },
        ];
      default:
        return [];
    }
  };

  const getStats = () => {
    switch (userRole) {
      case "tutor":
        return [
          {
            label: "Active Courses",
            value: "6",
            icon: GraduationCap,
            color: "text-green-600",
          },
          {
            label: "Total Students",
            value: "45",
            icon: Users,
            color: "text-green-600",
          },
          {
            label: "Pending Reviews",
            value: "12",
            icon: FileText,
            color: "text-orange-600",
          },
          {
            label: "Teaching Hours",
            value: "156h",
            icon: Clock,
            color: "text-purple-600",
          },
        ];
      case "admin":
        return [
          {
            label: "Total Users",
            value: "1,234",
            icon: Users,
            color: "text-green-600",
          },
          {
            label: "Active Courses",
            value: "89",
            icon: BookOpen,
            color: "text-green-600",
          },
          {
            label: "System Uptime",
            value: "99.9%",
            icon: TrendingUp,
            color: "text-green-600",
          },
          {
            label: "Storage Used",
            value: "2.4TB",
            icon: BarChart3,
            color: "text-purple-600",
          },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-green-50 p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-800 mb-2">
              NYS Virtual Campus
            </h1>
            <p className="text-gray-700 font-medium">{getWelcomeMessage()}</p>
            <p className="text-sm text-gray-600 mt-1">
              National Youth Service Kenya - Digital Learning Platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-sm px-3 py-1 bg-green-100 text-green-800 font-medium"
            >
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border border-gray-200">
        <CardHeader className="bg-green-600 text-white">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getQuickActions().map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 border border-gray-300 hover:border-green-500 hover:bg-green-50"
                onClick={() => onNavigate(action.page)}
              >
                <div className={`p-2 ${action.color} text-white`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {action.title}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-200">
            <CardHeader className="bg-green-600 text-white">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Your Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {getStats().map((stat, index) => (
                  <div
                    key={index}
                    className="text-center p-4 border border-gray-200 bg-white"
                  >
                    <stat.icon
                      className={`h-8 w-8 mx-auto mb-2 ${stat.color}`}
                    />
                    <div className="text-2xl font-bold text-gray-800">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border border-gray-200">
          <CardHeader className="bg-green-600 text-white">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {getRecentActivity().map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border border-gray-200 bg-white"
                >
                  <div className="w-2 h-2 bg-gray-400 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-600">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campus News & Updates */}
      <Card className="border border-gray-200">
        <CardHeader className="bg-green-600 text-white">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Campus News & Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-gray-200 bg-white">
              <h3 className="font-bold text-gray-800 mb-2">
                New Course Available
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Introduction to Digital Marketing is now available for
                enrollment.
              </p>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white font-medium"
                onClick={() => onNavigate("courses")}
              >
                View Courses
              </Button>
            </div>
            <div className="p-4 border border-gray-200 bg-white">
              <h3 className="font-bold text-gray-800 mb-2">
                System Maintenance
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Scheduled maintenance will occur this weekend. All services will
                be temporarily unavailable.
              </p>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white font-medium"
                onClick={() => onNavigate("announcements")}
              >
                View Announcements
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
