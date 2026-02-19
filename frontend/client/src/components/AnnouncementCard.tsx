import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, BookOpen, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AnnouncementCardProps {
  id: string;
  title: string;
  content: string;
  courseName?: string;
  postedBy: string;
  postedAt: Date;
  priority?: "normal" | "important";
}

export function AnnouncementCard({
  title,
  content,
  courseName,
  postedBy,
  postedAt,
  priority = "normal",
}: AnnouncementCardProps) {
  const timeAgo = formatDistanceToNow(postedAt, { addSuffix: true });

  return (
    <Card className="hover-elevate" data-testid={`card-announcement-${title}`}>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <div className={`rounded-lg p-2 ${priority === "important" ? "bg-chart-2/10 text-chart-2" : "bg-primary/10 text-primary"}`}>
          {priority === "important" ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight" data-testid="text-announcement-title">
              {title}
            </h3>
            {priority === "important" && (
              <Badge variant="destructive" className="shrink-0">Important</Badge>
            )}
          </div>
          {courseName && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <BookOpen className="h-3 w-3" />
              <span>{courseName}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground" data-testid="text-announcement-content">
          {content}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {postedBy.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <span>{postedBy}</span>
          <span>•</span>
          <span>{timeAgo}</span>
        </div>
      </CardContent>
    </Card>
  );
}
