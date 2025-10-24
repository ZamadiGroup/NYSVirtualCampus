import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, TrendingUp, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AddUserDialog } from "@/components/AddUserDialog";
import { AddCourseDialog } from "@/components/AddCourseDialog";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            System overview and management
          </p>
        </div>
        <div className="flex gap-2">
          <AddUserDialog onUserAdded={() => console.log('User added successfully')} />
          <AddCourseDialog onCourseAdded={() => console.log('Course added successfully')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={1247}
          icon={Users}
          accentColor="primary"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Active Courses"
          value={68}
          icon={BookOpen}
          accentColor="chart-3"
        />
        <StatCard
          title="Total Tutors"
          value={45}
          icon={GraduationCap}
          accentColor="chart-2"
        />
        <StatCard
          title="Enrollment Rate"
          value="92%"
          icon={TrendingUp}
          accentColor="primary"
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "James Omondi", role: "Student", status: "active" },
                { name: "Grace Njeri", role: "Tutor", status: "active" },
                { name: "Peter Kimani", role: "Student", status: "pending" },
                { name: "Alice Wambui", role: "Student", status: "active" },
              ].map((user, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                  data-testid={`user-item-${i}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                  </div>
                  <Badge variant={user.status === "active" ? "default" : "secondary"}>
                    {user.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { dept: "Technology", courses: 24, students: 456 },
                { dept: "Business", courses: 18, students: 328 },
                { dept: "Engineering", courses: 15, students: 267 },
                { dept: "Healthcare", courses: 11, students: 196 },
              ].map((dept, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                  data-testid={`dept-stat-${i}`}
                >
                  <div>
                    <p className="font-medium">{dept.dept}</p>
                    <p className="text-sm text-muted-foreground">
                      {dept.courses} courses
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{dept.students}</p>
                    <p className="text-xs text-muted-foreground">students</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
