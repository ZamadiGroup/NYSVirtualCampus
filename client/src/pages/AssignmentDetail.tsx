import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { submissionsApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

type Question = {
  text: string;
  imageUrl?: string;
  choices?: string[];
};

export type Assignment = {
  id: string;
  courseId: string;
  title: string;
  type: "auto" | "upload";
  instructions: string;
  questions: Question[];
};

type Props = {
  assignment: Assignment;
  onSubmit?: (submission: any) => void;
};

export default function AssignmentDetail({ assignment, onSubmit }: Props) {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [uploadLink, setUploadLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const currentUser = getCurrentUser();
      if (!currentUser?.userId) {
        toast({
          title: "Error",
          description: "You must be logged in to submit assignments.",
          variant: "destructive",
        });
        return;
      }
      const submissionData = {
        assignmentId: assignment.id,
        studentId: currentUser.userId,
        answers,
        uploadLink: assignment.type === "upload" ? uploadLink : undefined,
      };

      const newSubmission = await submissionsApi.create(submissionData);
      toast({
        title: "Assignment submitted",
        description: "Your assignment has been submitted successfully.",
      });
      onSubmit?.(newSubmission);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit assignment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{assignment.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Instructions</Label>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {assignment.instructions}
            </p>
          </div>

          {assignment.questions.map((q, idx) => (
            <Card key={idx}>
              <CardContent className="space-y-3 p-4">
                <div>
                  <Label>Question {idx + 1}</Label>
                  <p className="whitespace-pre-wrap">{q.text}</p>
                </div>
                {q.imageUrl && (
                  <img
                    src={q.imageUrl}
                    alt={`Question ${idx + 1}`}
                    className="max-h-64 rounded border"
                  />
                )}

                {assignment.type === "auto" ? (
                  <div>
                    <Label>Your answer</Label>
                    <Input
                      value={answers[idx] || ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [idx]: e.target.value })
                      }
                      placeholder="Type your answer or choice"
                    />
                  </div>
                ) : (
                  <div>
                    <Label>Your response</Label>
                    <Textarea
                      value={answers[idx] || ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [idx]: e.target.value })
                      }
                      placeholder="Write your response"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {assignment.type === "upload" && (
            <div>
              <Label>Upload document link</Label>
              <Input
                value={uploadLink}
                onChange={(e) => setUploadLink(e.target.value)}
                placeholder="https://drive/onedrive link to your document"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Provide a shareable link to your file upload.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              data-testid="button-submit-assignment"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
