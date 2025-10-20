import { AssignmentCard } from "../AssignmentCard";

export default function AssignmentCardExample() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
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
        dueDate={lastWeek}
        status="graded"
        grade={85}
        onView={() => console.log("View submission")}
      />
    </div>
  );
}
