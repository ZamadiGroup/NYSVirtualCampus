import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type GradeRecord = {
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  score?: number; // auto graded
  manualScore?: number; // lecturer graded
  maxScore: number;
  status: "pending" | "graded";
};

type Props = {
  grades: GradeRecord[];
};

export default function StudentGrades({ grades }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">My Grades</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {grades.map((g) => (
          <Card key={g.assignmentId}>
            <CardHeader>
              <CardTitle className="text-base">{g.assignmentTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <p>Course: {g.courseId}</p>
                <p>Status: {g.status}</p>
                {g.status === "graded" ? (
                  <p>
                    Score: {(g.score ?? g.manualScore ?? 0)} / {g.maxScore}
                  </p>
                ) : (
                  <p>Awaiting grading...</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


