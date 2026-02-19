import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { announcementsApi } from "@/lib/api";

export type Announcement = {
  id: string;
  message: string;
  authorRole: "tutor" | "admin";
  authorName: string;
  createdAt: string;
};

type Props = {
  items: Announcement[];
  canPost?: boolean;
  authorRole?: "tutor" | "admin";
  authorName?: string;
  onPost?: (a: Announcement) => void;
};

export default function Announcements({ items, canPost, authorRole, authorName, onPost }: Props) {
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Announcements</h2>
      {canPost && (
        <Card>
          <CardHeader>
            <CardTitle>Post an announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="ann">Message</Label>
            <Textarea id="ann" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write an announcement for students..." />
            <div className="flex justify-end">
              <Button 
                disabled={isPosting || !draft.trim()}
                onClick={async () => {
                  try {
                    setIsPosting(true);
                    const announcementData = {
                      title: "Announcement",
                      message: draft,
                      authorId: "demo-author-id", // In real app, get from auth context
                      isGlobal: true,
                    };
                    
                    const newAnnouncement: any = await announcementsApi.create(announcementData);
                    const a: Announcement = {
                      id: newAnnouncement.id,
                      message: newAnnouncement.message,
                      authorRole: authorRole || "tutor",
                      authorName: authorName || "",
                      createdAt: newAnnouncement.createdAt,
                    };
                    onPost?.(a);
                    setDraft("");
                    toast({ title: "Announcement posted", description: "Your announcement has been posted successfully." });
                  } catch (error) {
                    toast({ 
                      title: "Error", 
                      description: error instanceof Error ? error.message : "Failed to post announcement",
                      variant: "destructive"
                    });
                  } finally {
                    setIsPosting(false);
                  }
                }}
              >
                {isPosting ? "Posting..." : "Post"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="text-base">{a.authorName} ({a.authorRole})</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{a.message}</p>
              <p className="text-xs text-muted-foreground mt-2">{new Date(a.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


