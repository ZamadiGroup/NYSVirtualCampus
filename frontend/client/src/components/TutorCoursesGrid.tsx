import { useEffect, useState } from "react";
import { coursesApi, ApiCourse } from "@/lib/api";
import { CourseCard } from "@/components/CourseCard";
import { EnrollmentDialog } from "@/components/EnrollmentDialog";

interface TutorCoursesGridProps {
  onOpenCourse?: (id: string) => void;
}

export default function TutorCoursesGrid({ onOpenCourse }: TutorCoursesGridProps) {
  const [courses, setCourses] = useState<ApiCourse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    coursesApi.getMine()
      .then((data: any) => {
        if (!mounted) return;
        setCourses(Array.isArray(data) ? data : []);
      })
      .catch((err: any) => {
        console.error('Failed to load tutor courses', err);
        if (!mounted) return;
        setError(err.message || 'Failed to load courses');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Loading courses...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!courses || courses.length === 0) return <div className="text-muted-foreground">You have no assigned courses yet.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {courses.map((course: any) => {
        const id = course._id || course.id || '';
        const instructor = (course.instructorId && course.instructorId.fullName) ? course.instructorId.fullName : 'Instructor';
        return (
          <CourseCard
            key={id}
            id={String(id)}
            title={course.title}
            instructor={instructor}
            thumbnail={course.thumbnail || ''}
            department={course.department || 'General'}
            enrolledCount={course.enrolledCount || 0}
            userRole="tutor"
            onManageEnrollment={() => { /* noop - EnrollmentDialog provided as child */ }}
            onContinue={() => onOpenCourse?.(String(id))}
          >
            <EnrollmentDialog
              courseId={String(id)}
              courseTitle={course.title}
              userRole="tutor"
              onEnrollmentComplete={() => {
                // refresh list after enrollment changes
                coursesApi.getMine().then((d: any) => setCourses(Array.isArray(d) ? d : []));
              }}
            />
          </CourseCard>
        );
      })}
    </div>
  );
}
