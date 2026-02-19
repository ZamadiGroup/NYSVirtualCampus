import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type GradeRecord = {
  assignmentId: string;
  assignmentTitle: string;
  studentName: string;
  courseId: string;
  score?: number;
  manualScore?: number;
  maxScore: number;
  status: "pending" | "graded";
};

type Props = {
  grades: GradeRecord[];
  onUpdateManual: (assignmentId: string, studentName: string, score: number) => void;
};

export default function TutorGrades({ grades, onUpdateManual }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Grades (Tutor)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {grades.map((g) => (
          <Card key={`${g.assignmentId}-${g.studentName}`}>
            <CardHeader>
              <CardTitle className="text-base">{g.assignmentTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>Student: {g.studentName}</div>
              <div>Course: {g.courseId}</div>
              <div>Status: {g.status}</div>
              <div>Score: {(g.score ?? g.manualScore ?? 0)} / {g.maxScore}</div>
              <div className="flex items-center gap-2 mt-2">
                <Label className="text-xs">Manual score</Label>
                <Input
                  type="number"
                  className="h-8 w-24"
                  placeholder="0"
                  onChange={(e) => (e.currentTarget.dataset.score = e.target.value)}
                  data-score=""
                />
                <Button size="sm" onClick={(e) => {
                  const input = (e.currentTarget.previousSibling as HTMLInputElement);
                  const value = Number((input as any)?.dataset?.score || (input as HTMLInputElement).value || 0);
                  onUpdateManual(g.assignmentId, g.studentName, value);
                }}>Save</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


