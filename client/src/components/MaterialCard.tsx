import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Video, Link as LinkIcon, Download } from "lucide-react";

interface MaterialCardProps {
  id: string;
  title: string;
  type: "pdf" | "video" | "link";
  size?: string;
  uploadedAt: Date;
  onDownload?: () => void;
  onView?: () => void;
}

export function MaterialCard({
  title,
  type,
  size,
  onDownload,
  onView,
}: MaterialCardProps) {
  const typeConfig = {
    pdf: { icon: FileText, color: "text-destructive", bgColor: "bg-destructive/10" },
    video: { icon: Video, color: "text-chart-3", bgColor: "bg-chart-3/10" },
    link: { icon: LinkIcon, color: "text-primary", bgColor: "bg-primary/10" },
  };

  const Icon = typeConfig[type].icon;

  return (
    <Card className="hover-elevate" data-testid={`card-material-${title}`}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`rounded-lg p-3 ${typeConfig[type].bgColor}`}>
          <Icon className={`h-5 w-5 ${typeConfig[type].color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate" data-testid="text-material-title">
            {title}
          </h4>
          {size && (
            <p className="text-sm text-muted-foreground">{size}</p>
          )}
        </div>
        <div className="flex gap-2">
          {type !== "link" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDownload}
              data-testid="button-download-material"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            onClick={onView}
            data-testid="button-view-material"
          >
            {type === "link" ? "Open" : "View"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
