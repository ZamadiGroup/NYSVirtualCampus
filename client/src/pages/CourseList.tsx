import { useState } from "react";
import { CourseCard } from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import techThumbnail from "@assets/generated_images/Technology_course_thumbnail_5e4c2c8c.png";
import businessThumbnail from "@assets/generated_images/Business_course_thumbnail_7c0cd7e6.png";
import engineeringThumbnail from "@assets/generated_images/Engineering_course_thumbnail_06f884c3.png";
import healthcareThumbnail from "@assets/generated_images/Healthcare_course_thumbnail_5609d386.png";

export default function CourseList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const departments = ["All", "Technology", "Business", "Engineering", "Healthcare"];

  const courses = [
    {
      id: "1",
      title: "Introduction to Computer Science",
      instructor: "Dr. Sarah Kamau",
      thumbnail: techThumbnail,
      department: "Technology",
      enrolledCount: 145,
    },
    {
      id: "2",
      title: "Business Management Fundamentals",
      instructor: "Prof. John Mwangi",
      thumbnail: businessThumbnail,
      department: "Business",
      enrolledCount: 98,
    },
    {
      id: "3",
      title: "Civil Engineering Basics",
      instructor: "Eng. Mary Wanjiru",
      thumbnail: engineeringThumbnail,
      department: "Engineering",
      enrolledCount: 76,
    },
    {
      id: "4",
      title: "Healthcare Management",
      instructor: "Dr. James Ochieng",
      thumbnail: healthcareThumbnail,
      department: "Healthcare",
      enrolledCount: 62,
    },
    {
      id: "5",
      title: "Advanced Database Systems",
      instructor: "Dr. Sarah Kamau",
      thumbnail: techThumbnail,
      department: "Technology",
      enrolledCount: 89,
    },
    {
      id: "6",
      title: "Financial Accounting",
      instructor: "Prof. John Mwangi",
      thumbnail: businessThumbnail,
      department: "Business",
      enrolledCount: 112,
    },
  ];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !selectedDept || selectedDept === "All" || course.department === selectedDept;
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
              variant={selectedDept === dept || (dept === "All" && !selectedDept) ? "default" : "outline"}
              className="cursor-pointer hover-elevate active-elevate-2"
              onClick={() => setSelectedDept(dept === "All" ? null : dept)}
              data-testid={`filter-dept-${dept.toLowerCase()}`}
            >
              {dept}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            {...course}
            onEnroll={() => console.log(`Enroll in ${course.title}`)}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No courses found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
