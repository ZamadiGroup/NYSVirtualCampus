import { useState, useEffect } from "react";
import { CourseCard } from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { coursesApi } from "@/lib/api";
import techThumbnail from "@assets/generated_images/Technology_course_thumbnail_5e4c2c8c.png";
import businessThumbnail from "@assets/generated_images/Business_course_thumbnail_7c0cd7e6.png";
import engineeringThumbnail from "@assets/generated_images/Engineering_course_thumbnail_06f884c3.png";
import healthcareThumbnail from "@assets/generated_images/Healthcare_course_thumbnail_5609d386.png";

// Default thumbnails by department
const defaultThumbnails: Record<string, string> = {
  Technology: techThumbnail,
  Business: businessThumbnail,
  Engineering: engineeringThumbnail,
  Healthcare: healthcareThumbnail,
};

interface Course {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  department: string;
  instructorId?: { fullName?: string; _id?: string } | string;
  thumbnail?: string;
  enrolledCount?: number;
}

interface CourseListProps {
  userRole?: "student" | "tutor" | "admin";
}

export default function CourseList({ userRole = "student" }: CourseListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const departments = [
    "All",
    "Technology",
    "Business",
    "Engineering",
    "Healthcare",
  ];

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await coursesApi.getAll();
      const normalizedCourses = Array.isArray(data)
        ? data.map((c: any) => ({
            ...c,
            id: c.id || c._id,
          }))
        : [];
      setCourses(normalizedCourses);
    } catch (err: any) {
      console.error("Failed to fetch courses:", err);
      setError(err?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Refresh handler for when courses are updated
  const handleCourseUpdate = () => {
    fetchCourses();
  };

  // Helper to get instructor name
  const getInstructorName = (course: Course): string => {
    if (
      typeof course.instructorId === "object" &&
      course.instructorId?.fullName
    ) {
      return course.instructorId.fullName;
    }
    return "Unknown Instructor";
  };

  // Helper to get thumbnail
  const getThumbnail = (course: Course): string => {
    if (course.thumbnail) return course.thumbnail;
    return defaultThumbnails[course.department] || techThumbnail;
  };

  const filteredCourses = courses.filter((course) => {
    const instructorName = getInstructorName(course);
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      !selectedDept ||
      selectedDept === "All" ||
      course.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Browse Courses
        </h1>
        <p className="text-muted-foreground mt-1">
          Explore and enroll in available courses
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses or instructors..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-courses"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {departments.map((dept) => (
            <Badge
              key={dept}
              variant={
                selectedDept === dept || (dept === "All" && !selectedDept)
                  ? "default"
                  : "outline"
              }
              className="cursor-pointer hover-elevate active-elevate-2"
              onClick={() => setSelectedDept(dept === "All" ? null : dept)}
              data-testid={`filter-dept-${dept.toLowerCase()}`}
            >
              {dept}
            </Badge>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading courses...</span>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              instructor={getInstructorName(course)}
              thumbnail={getThumbnail(course)}
              department={course.department}
              enrolledCount={
                (course as any).enrollEmails?.length ||
                course.enrolledCount ||
                0
              }
              userRole={userRole}
              onEnroll={(enrollmentKey) => {
                console.log(
                  `Enroll in ${course.title} with key: ${enrollmentKey}`,
                );
                // TODO: Implement actual enrollment API call
              }}
              onUpdate={handleCourseUpdate}
            />
          ))}
        </div>
      )}

      {!loading && !error && filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No courses found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
}
