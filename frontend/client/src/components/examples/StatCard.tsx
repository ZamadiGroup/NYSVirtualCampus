import { StatCard } from "../StatCard";
import { BookOpen, Users, FileText, Award } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      <StatCard
        title="Enrolled Courses"
        value={6}
        icon={BookOpen}
        accentColor="primary"
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        title="Active Students"
        value={234}
        icon={Users}
        accentColor="chart-3"
      />
      <StatCard
        title="Pending Assignments"
        value={3}
        icon={FileText}
        accentColor="chart-2"
      />
      <StatCard
        title="Completed Courses"
        value={12}
        icon={Award}
        accentColor="primary"
      />
    </div>
  );
}
