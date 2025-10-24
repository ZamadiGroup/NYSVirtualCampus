import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Users, Clock, Key } from "lucide-react";

interface CourseCardProps {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  department: string;
  enrolledCount: number;
  progress?: number;
  isEnrolled?: boolean;
  userRole?: "student" | "tutor" | "admin";
  onEnroll?: (enrollmentKey?: string) => void;
  onContinue?: () => void;
}

export function CourseCard({
  title,
  instructor,
  thumbnail,
  department,
  enrolledCount,
  progress,
  isEnrolled = false,
  userRole = "student",
  onEnroll,
  onContinue,
}: CourseCardProps) {
  const [enrollmentKey, setEnrollmentKey] = useState("");
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);

  const handleEnroll = () => {
    if (onEnroll) {
      onEnroll(enrollmentKey);
      setIsEnrollDialogOpen(false);
      setEnrollmentKey("");
    }
  };
  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-course-${title}`}>
      <div className="aspect-video w-full overflow-hidden bg-muted">
        <img
          src={thumbnail}
          alt={title}
          className="h-full w-full object-cover"
        />
      </div>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2" data-testid="text-course-title">
            {title}
          </h3>
          <Badge variant="secondary" className="shrink-0">
            {department}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground" data-testid="text-instructor">
          {instructor}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{enrolledCount}</span>
          </div>
          {isEnrolled && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{progress}% Complete</span>
            </div>
          )}
        </div>
        {isEnrolled && progress !== undefined && (
          <Progress value={progress} className="h-2" />
        )}
      </CardContent>
      <CardFooter>
        {isEnrolled ? (
          <Button
            className="w-full"
            onClick={onContinue}
            data-testid="button-continue-course"
          >
            Continue Learning
          </Button>
        ) : userRole === "student" ? (
          <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full"
                data-testid="button-enroll-course"
              >
                <Key className="w-4 h-4 mr-2" />
                Enroll with Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enroll in {title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter the enrollment key provided by your instructor to join this course.
                </p>
                <div className="space-y-2">
                  <label htmlFor="enrollment-key" className="text-sm font-medium">
                    Enrollment Key
                  </label>
                  <Input
                    id="enrollment-key"
                    placeholder="Enter enrollment key"
                    value={enrollmentKey}
                    onChange={(e) => setEnrollmentKey(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsEnrollDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEnroll}
                    disabled={!enrollmentKey.trim()}
                  >
                    Enroll
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="w-full text-center text-sm text-muted-foreground py-2">
            {userRole === "tutor" ? "You are the instructor" : "Admin access"}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
