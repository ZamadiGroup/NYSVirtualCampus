import { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { CourseCard } from "@/components/CourseCard";
import { AssignmentCard } from "@/components/AssignmentCard";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { BookOpen, FileText, Award, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import techThumbnail from "@assets/generated_images/Technology_course_thumbnail_5e4c2c8c.png";
import businessThumbnail from "@assets/generated_images/Business_course_thumbnail_7c0cd7e6.png";
import engineeringThumbnail from "@assets/generated_images/Engineering_course_thumbnail_06f884c3.png";
import { usePlanNotification } from "@/components/PlanNotification";

export default function StudentDashboard() {
  const { showNotification } = usePlanNotification();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // State for enrolled and available courses
  const [enrolledCourses, setEnrolledCourses] = useState([
    {
      id: "1",
      title: "Introduction to Computer Science",
      instructor: "Dr. Sarah Kamau",
      thumbnail: techThumbnail,
      department: "Technology",
      enrolledCount: 145,
      progress: 65,
    },
    {
      id: "2",
      title: "Business Management Fundamentals",
      instructor: "Prof. John Mwangi",
      thumbnail: businessThumbnail,
      department: "Business",
      enrolledCount: 98,
      progress: 45,
    },
    {
      id: "3",
      title: "Civil Engineering Basics",
      instructor: "Eng. Mary Wanjiru",
      thumbnail: engineeringThumbnail,
      department: "Engineering",
      enrolledCount: 76,
      progress: 30,
    }
  ]);

  const [availableCourses, setAvailableCourses] = useState([
    {
      id: "4",
      title: "Advanced Mathematics",
      instructor: "Dr. James Omondi",
      thumbnail: techThumbnail,
      department: "Mathematics",
      enrolledCount: 112,
      progress: 0,
    },
    {
      id: "5",
      title: "Introduction to Psychology",
      instructor: "Prof. Lucy Njeri",
      thumbnail: businessThumbnail,
      department: "Social Sciences",
      enrolledCount: 156,
      progress: 0,
    }
  ]);

  // Function to handle enrollment
  const handleEnroll = (courseId: string) => {
    // Find the course in available courses
    const courseToEnroll = availableCourses.find(course => course.id === courseId);
    
    if (courseToEnroll) {
      // Add to enrolled courses
      setEnrolledCourses([...enrolledCourses, {...courseToEnroll, progress: 0}]);
      
      // Remove from available courses
      setAvailableCourses(availableCourses.filter(course => course.id !== courseId));
      
      // Show success notification
      showNotification({
        title: "Enrolled Successfully",
        description: `You have been enrolled in ${courseToEnroll.title}`,
        variant: "success",
      });
    }
  };

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
          value={enrolledCourses.length}
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
          <TabsTrigger value="available" data-testid="tab-available">
            Available Courses
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            Assignments
          </TabsTrigger>
          <TabsTrigger value="announcements" data-testid="tab-announcements">
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  instructor={course.instructor}
                  thumbnail={course.thumbnail}
                  department={course.department}
                  enrolledCount={course.enrolledCount}
                  progress={course.progress}
                  isEnrolled={true}
                  userRole="student"
                  onContinue={() => console.log("Continue course", course.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">You haven't enrolled in any courses yet.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="available" className="space-y-4">
          {availableCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  instructor={course.instructor}
                  thumbnail={course.thumbnail}
                  department={course.department}
                  enrolledCount={course.enrolledCount}
                  progress={0}
                  isEnrolled={false}
                  userRole="student"
                  onEnroll={() => handleEnroll(course.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No available courses at the moment.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {enrolledCourses.length > 0 ? (
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
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No assignments available. Enroll in courses to see assignments.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          {enrolledCourses.length > 0 ? (
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
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No announcements available. Enroll in courses to see announcements.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
