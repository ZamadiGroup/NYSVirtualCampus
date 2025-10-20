import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AssignmentCardProps {
  id: string;
  title: string;
  courseName: string;
  dueDate: Date;
  status: "pending" | "submitted" | "graded" | "overdue";
  grade?: number;
  onSubmit?: () => void;
  onView?: () => void;
}

export function AssignmentCard({
  title,
  courseName,
  dueDate,
  status,
  grade,
  onSubmit,
  onView,
}: AssignmentCardProps) {
  const statusConfig = {
    pending: { label: "Pending", variant: "secondary" as const },
    submitted: { label: "Submitted", variant: "default" as const },
    graded: { label: "Graded", variant: "default" as const },
    overdue: { label: "Overdue", variant: "destructive" as const },
  };

  const isOverdue = status === "overdue";
  const timeUntilDue = formatDistanceToNow(dueDate, { addSuffix: true });

  return (
    <Card className="hover-elevate" data-testid={`card-assignment-${title}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1 flex-1">
          <h3 className="font-semibold leading-tight" data-testid="text-assignment-title">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{courseName}</p>
        </div>
        <Badge variant={statusConfig[status].variant}>
          {statusConfig[status].label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 pb-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Due {timeUntilDue}</span>
          </div>
        </div>
        {status === "graded" && grade !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Grade:</span>
            <span className="text-lg font-bold text-primary">{grade}%</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        {status === "pending" && (
          <Button
            onClick={onSubmit}
            className="flex-1"
            data-testid="button-submit-assignment"
          >
            <FileText className="mr-2 h-4 w-4" />
            Submit Assignment
          </Button>
        )}
        {(status === "submitted" || status === "graded") && (
          <Button
            variant="outline"
            onClick={onView}
            className="flex-1"
            data-testid="button-view-submission"
          >
            View Submission
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
