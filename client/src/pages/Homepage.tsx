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
  Settings
} from "lucide-react";

interface HomepageProps {
  userRole: "student" | "tutor" | "admin";
  userName: string;
  onNavigate: (page: string) => void;
}

export default function Homepage({ userRole, userName, onNavigate }: HomepageProps) {
  const getWelcomeMessage = () => {
    switch (userRole) {
      case "student":
        return `Welcome back, ${userName}! Ready to continue your learning journey?`;
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
      case "student":
        return [
          { title: "My Courses", icon: BookOpen, page: "courses", color: "bg-blue-500" },
          { title: "Assignments", icon: FileText, page: "assignments", color: "bg-green-500" },
          { title: "Announcements", icon: Bell, page: "announcements", color: "bg-yellow-500" },
          { title: "Dashboard", icon: BarChart3, page: "dashboard", color: "bg-purple-500" },
        ];
      case "tutor":
        return [
          { title: "My Courses", icon: GraduationCap, page: "courses", color: "bg-blue-500" },
          { title: "Students", icon: Users, page: "students", color: "bg-green-500" },
          { title: "Assignments", icon: FileText, page: "assignments", color: "bg-yellow-500" },
          { title: "Analytics", icon: BarChart3, page: "analytics", color: "bg-purple-500" },
        ];
      case "admin":
        return [
          { title: "Users", icon: Users, page: "users", color: "bg-blue-500" },
          { title: "Courses", icon: BookOpen, page: "courses", color: "bg-green-500" },
          { title: "Analytics", icon: BarChart3, page: "analytics", color: "bg-yellow-500" },
          { title: "Settings", icon: Settings, page: "settings", color: "bg-purple-500" },
        ];
      default:
        return [];
    }
  };

  const getRecentActivity = () => {
    switch (userRole) {
      case "student":
        return [
          { title: "New assignment posted", time: "2 hours ago", type: "assignment" },
          { title: "Course material updated", time: "1 day ago", type: "course" },
          { title: "Grade posted for Math 101", time: "2 days ago", type: "grade" },
        ];
      case "tutor":
        return [
          { title: "3 new submissions received", time: "1 hour ago", type: "submission" },
          { title: "Student question in Discussion Forum", time: "3 hours ago", type: "question" },
          { title: "Course enrollment increased", time: "1 day ago", type: "enrollment" },
        ];
      case "admin":
        return [
          { title: "5 new user registrations", time: "2 hours ago", type: "registration" },
          { title: "System maintenance completed", time: "1 day ago", type: "maintenance" },
          { title: "Backup process successful", time: "2 days ago", type: "backup" },
        ];
      default:
        return [];
    }
  };

  const getStats = () => {
    switch (userRole) {
      case "student":
        return [
          { label: "Active Courses", value: "4", icon: BookOpen, color: "text-blue-600" },
          { label: "Pending Assignments", value: "3", icon: FileText, color: "text-orange-600" },
          { label: "Completed Courses", value: "2", icon: Award, color: "text-green-600" },
          { label: "Study Hours", value: "24h", icon: Clock, color: "text-purple-600" },
        ];
      case "tutor":
        return [
          { label: "Active Courses", value: "6", icon: GraduationCap, color: "text-blue-600" },
          { label: "Total Students", value: "45", icon: Users, color: "text-green-600" },
          { label: "Pending Reviews", value: "12", icon: FileText, color: "text-orange-600" },
          { label: "Teaching Hours", value: "156h", icon: Clock, color: "text-purple-600" },
        ];
      case "admin":
        return [
          { label: "Total Users", value: "1,234", icon: Users, color: "text-blue-600" },
          { label: "Active Courses", value: "89", icon: BookOpen, color: "text-green-600" },
          { label: "System Uptime", value: "99.9%", icon: TrendingUp, color: "text-green-600" },
          { label: "Storage Used", value: "2.4TB", icon: BarChart3, color: "text-purple-600" },
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
            <p className="text-gray-700 font-medium">
              {getWelcomeMessage()}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              National Youth Service Kenya - Digital Learning Platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm px-3 py-1 bg-green-100 text-green-800 font-medium">
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
                <span className="text-sm font-medium text-gray-700">{action.title}</span>
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
                  <div key={index} className="text-center p-4 border border-gray-200 bg-white">
                    <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                    <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
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
                <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 bg-white">
                  <div className="w-2 h-2 bg-gray-400 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{activity.title}</p>
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
              <h3 className="font-bold text-gray-800 mb-2">New Course Available</h3>
              <p className="text-sm text-gray-600 mb-3">
                Introduction to Digital Marketing is now available for enrollment.
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
              <h3 className="font-bold text-gray-800 mb-2">System Maintenance</h3>
              <p className="text-sm text-gray-600 mb-3">
                Scheduled maintenance will occur this weekend. All services will be temporarily unavailable.
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