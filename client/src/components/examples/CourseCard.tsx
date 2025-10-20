import { CourseCard } from "../CourseCard";
import techThumbnail from "@assets/generated_images/Technology_course_thumbnail_5e4c2c8c.png";

export default function CourseCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <CourseCard
        id="1"
        title="Introduction to Computer Science"
        instructor="Dr. Sarah Kamau"
        thumbnail={techThumbnail}
        department="Technology"
        enrolledCount={145}
        progress={65}
        isEnrolled={true}
        onContinue={() => console.log("Continue course")}
      />
      <CourseCard
        id="2"
        title="Business Management Fundamentals"
        instructor="Prof. John Mwangi"
        thumbnail={techThumbnail}
        department="Business"
        enrolledCount={98}
        onEnroll={() => console.log("Enroll in course")}
      />
    </div>
  );
}
