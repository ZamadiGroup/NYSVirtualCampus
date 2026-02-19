import { AnnouncementCard } from "../AnnouncementCard";

export default function AnnouncementCardExample() {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    <div className="space-y-4 p-6 max-w-2xl">
      <AnnouncementCard
        id="1"
        title="Mid-Semester Exam Schedule Released"
        content="The mid-semester examination timetable has been published. Please check your course pages for specific dates and venues. Ensure you arrive 30 minutes before the exam starts."
        courseName="Introduction to Computer Science"
        postedBy="Dr. Sarah Kamau"
        postedAt={today}
        priority="important"
      />
      <AnnouncementCard
        id="2"
        title="New Learning Materials Available"
        content="Week 8 lecture notes and supplementary reading materials have been uploaded. Don't forget to review them before our next class session."
        courseName="Business Management"
        postedBy="Prof. John Mwangi"
        postedAt={yesterday}
      />
    </div>
  );
}
