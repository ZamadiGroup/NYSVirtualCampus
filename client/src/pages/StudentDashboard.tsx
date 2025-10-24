import { StatCard } from "@/components/StatCard";
import { CourseCard } from "@/components/CourseCard";
import { AssignmentCard } from "@/components/AssignmentCard";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { BookOpen, FileText, Award, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import techThumbnail from "@assets/generated_images/Technology_course_thumbnail_5e4c2c8c.png";
import businessThumbnail from "@assets/generated_images/Business_course_thumbnail_7c0cd7e6.png";
import engineeringThumbnail from "@assets/generated_images/Engineering_course_thumbnail_06f884c3.png";

export default function StudentDashboard() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Welcome back, Student!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your learning progress overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Enrolled Courses"
          value={6}
          icon={BookOpen}
          accentColor="primary"
        />
        <StatCard
          title="Pending Assignments"
          value={3}
          icon={FileText}
          accentColor="chart-2"
        />
        <StatCard
          title="Completed Courses"
          value={2}
          icon={Award}
          accentColor="primary"
        />
        <StatCard
          title="Study Hours"
          value={24}
          icon={Clock}
          accentColor="chart-3"
        />
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList>
          <TabsTrigger value="courses" data-testid="tab-courses">
            My Courses
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            Assignments
          </TabsTrigger>
          <TabsTrigger value="announcements" data-testid="tab-announcements">
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CourseCard
              id="1"
              title="Introduction to Computer Science"
              instructor="Dr. Sarah Kamau"
              thumbnail={techThumbnail}
              department="Technology"
              enrolledCount={145}
              progress={65}
              isEnrolled={true}
              userRole="student"
              onContinue={() => console.log("Continue course")}
            />
            <CourseCard
              id="2"
              title="Business Management Fundamentals"
              instructor="Prof. John Mwangi"
              thumbnail={businessThumbnail}
              department="Business"
              enrolledCount={98}
              progress={45}
              isEnrolled={true}
              userRole="student"
              onContinue={() => console.log("Continue course")}
            />
            <CourseCard
              id="3"
              title="Civil Engineering Basics"
              instructor="Eng. Mary Wanjiru"
              thumbnail={engineeringThumbnail}
              department="Engineering"
              enrolledCount={76}
              progress={30}
              isEnrolled={true}
              userRole="student"
              onContinue={() => console.log("Continue course")}
            />
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AssignmentCard
              id="1"
              title="Database Design Project"
              courseName="Introduction to Computer Science"
              dueDate={tomorrow}
              status="pending"
              onSubmit={() => console.log("Submit assignment")}
            />
            <AssignmentCard
              id="2"
              title="Business Case Study Analysis"
              courseName="Business Management"
              dueDate={yesterday}
              status="submitted"
              onView={() => console.log("View submission")}
            />
            <AssignmentCard
              id="3"
              title="Structural Analysis Report"
              courseName="Civil Engineering"
              dueDate={today}
              status="graded"
              grade={85}
              onView={() => console.log("View submission")}
            />
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <div className="max-w-3xl space-y-4">
            <AnnouncementCard
              id="1"
              title="Mid-Semester Exam Schedule Released"
              content="The mid-semester examination timetable has been published. Please check your course pages for specific dates and venues."
              courseName="Introduction to Computer Science"
              postedBy="Dr. Sarah Kamau"
              postedAt={today}
              priority="important"
            />
            <AnnouncementCard
              id="2"
              title="New Learning Materials Available"
              content="Week 8 lecture notes and supplementary reading materials have been uploaded. Review them before our next session."
              courseName="Business Management"
              postedBy="Prof. John Mwangi"
              postedAt={yesterday}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
