import { useState, useEffect } from "react";
import { coursesApi, assignmentsApi } from "@/lib/api";
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

interface StudentDashboardProps {
  onOpenCourse?: (id: string) => void;
}

export default function StudentDashboard({
  onOpenCourse,
}: StudentDashboardProps) {
  const { showNotification } = usePlanNotification();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // State for enrolled and available courses
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

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
    },
  ]);

  useEffect(() => {
    let mounted = true;
    const fetchAvailable = async () => {
      try {
        const res = await coursesApi.getAvailable();
        if (!mounted) return;
        if (Array.isArray(res)) {
          setAvailableCourses(
            res.map((c: any) => ({
              id: c._id || c.id,
              title: c.title,
              instructor: c.instructorId?.fullName || "TBD",
              thumbnail: c.thumbnail || techThumbnail,
              department: c.department,
              enrolledCount: c.enrolledCount || 0,
              progress: 0,
            })),
          );
        }
      } catch (e) {
        console.warn("Failed to load available courses", e);
      }
    };
    fetchAvailable();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchEnrolled = async () => {
      try {
        const res = await coursesApi.getMyEnrollments();
        if (!mounted) return;
        if (Array.isArray(res)) {
          setEnrolledCourses(
            res.map((c: any) => ({
              id: c._id || c.id,
              title: c.title,
              instructor: c.instructorId?.fullName || "TBD",
              thumbnail: c.thumbnail || techThumbnail,
              department: c.department,
              enrolledCount: c.enrolledCount || 0,
              progress: 0,
            })),
          );
        }
      } catch (e) {
        console.warn("Failed to fetch enrolled courses", e);
      }
    };
    fetchEnrolled();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch assignments for enrolled courses
  useEffect(() => {
    let mounted = true;
    const fetchAssignments = async () => {
      try {
        // Backend now filters assignments based on student enrollments
        const res = await assignmentsApi.getAll();
        if (!mounted) return;
        if (Array.isArray(res)) {
          setAssignments(
            res.map((a: any) => ({
              id: String(a._id || a.id),
              title: a.title,
              courseName: a.courseId?.title || "Unknown Course",
              dueDate: a.dueDate ? new Date(a.dueDate) : null,
              status: "pending", // You can enhance this based on submission status
              type: a.type,
            })),
          );
        }
      } catch (e) {
        console.warn("Failed to fetch assignments", e);
      }
    };
    fetchAssignments();
    return () => {
      mounted = false;
    };
  }, [enrolledCourses]);

  // Function to handle enrollment
  const handleEnroll = (courseId: string) => {
    // Find the course in available courses
    const courseToEnroll = availableCourses.find(
      (course) => course.id === courseId,
    );

    if (courseToEnroll) {
      // Add to enrolled courses
      setEnrolledCourses([
        ...enrolledCourses,
        { ...courseToEnroll, progress: 0 },
      ]);

      // Remove from available courses
      setAvailableCourses(
        availableCourses.filter((course) => course.id !== courseId),
      );

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
          value={assignments.length}
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
                  onContinue={() => onOpenCourse?.(course.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                You haven't enrolled in any courses yet.
              </p>
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
              <p className="text-muted-foreground">
                No available courses at the moment.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  id={assignment.id}
                  title={assignment.title}
                  courseName={assignment.courseName}
                  dueDate={assignment.dueDate}
                  status={assignment.status}
                  onSubmit={() =>
                    console.log("Submit assignment", assignment.id)
                  }
                  onView={() => console.log("View assignment", assignment.id)}
                />
              ))}
            </div>
          ) : enrolledCourses.length > 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                No assignments yet. Check back later!
              </p>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                No assignments available. Enroll in courses to see assignments.
              </p>
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
              <p className="text-muted-foreground">
                No announcements available. Enroll in courses to see
                announcements.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
