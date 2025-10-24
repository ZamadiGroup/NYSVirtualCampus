import { StatCard } from "@/components/StatCard";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, FileCheck, TrendingUp, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import techThumbnail from "@assets/generated_images/Technology_course_thumbnail_5e4c2c8c.png";
import businessThumbnail from "@assets/generated_images/Business_course_thumbnail_7c0cd7e6.png";

type TutorDashboardProps = {
  onNavigate?: (page: string) => void;
};

export default function TutorDashboard({ onNavigate }: TutorDashboardProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Tutor Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your courses and track student progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="button-create-course" onClick={() => onNavigate?.("create-course")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Course
          </Button>
          <Button variant="outline" data-testid="button-create-assignment" onClick={() => onNavigate?.("create-assignment")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Assignment
          </Button>
          <Button variant="outline" data-testid="button-manage-assignments" onClick={() => onNavigate?.("manage-assignments")}>
            Manage Assignments
          </Button>
          <Button variant="outline" data-testid="button-tutor-grades" onClick={() => onNavigate?.("tutor-grades")}>
            Grades
          </Button>
          <Button variant="outline" data-testid="button-tutor-announcements" onClick={() => onNavigate?.("announcements")}>
            Announcements
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Courses"
          value={4}
          icon={BookOpen}
          accentColor="primary"
        />
        <StatCard
          title="Total Students"
          value={234}
          icon={Users}
          accentColor="chart-3"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Pending Submissions"
          value={18}
          icon={FileCheck}
          accentColor="chart-2"
        />
        <StatCard
          title="Avg. Completion Rate"
          value="78%"
          icon={TrendingUp}
          accentColor="primary"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">My Courses</h2>
          <Button variant="outline" data-testid="button-view-all-courses">
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CourseCard
            id="1"
            title="Introduction to Computer Science"
            instructor="Dr. Sarah Kamau"
            thumbnail={techThumbnail}
            department="Technology"
            enrolledCount={145}
            isEnrolled={false}
            userRole="tutor"
            onEnroll={() => console.log("Manage course")}
          />
          <CourseCard
            id="2"
            title="Advanced Database Systems"
            instructor="Dr. Sarah Kamau"
            thumbnail={businessThumbnail}
            department="Technology"
            enrolledCount={89}
            isEnrolled={false}
            userRole="tutor"
            onEnroll={() => console.log("Manage course")}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Recent Submissions</h2>
        <Card>
          <CardHeader>
            <CardTitle>Assignments Awaiting Grading</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                  data-testid={`submission-item-${i}`}
                >
                  <div className="space-y-1">
                    <p className="font-medium">Database Design Project</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted by Student {i} • 2 hours ago
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Pending</Badge>
                    <Button size="sm" data-testid={`button-grade-submission-${i}`}>
                      Grade
                    </Button>
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
