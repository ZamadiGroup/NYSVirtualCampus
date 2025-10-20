import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Users, Clock } from "lucide-react";

interface CourseCardProps {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  department: string;
  enrolledCount: number;
  progress?: number;
  isEnrolled?: boolean;
  onEnroll?: () => void;
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
  onEnroll,
  onContinue,
}: CourseCardProps) {
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
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={onEnroll}
            data-testid="button-enroll-course"
          >
            Enroll Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
