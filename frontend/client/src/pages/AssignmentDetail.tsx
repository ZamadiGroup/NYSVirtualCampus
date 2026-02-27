import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { submissionsApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { Upload, Link2, FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";

type Question = {
  text: string;
  imageUrl?: string;
  choices?: string[];
};

export type Assignment = {
  id: string;
  _id?: string;
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

type SubmissionStatus = {
  submitted: boolean;
  submission: any;
  grade: any;
};

export default function AssignmentDetail({ assignment, onSubmit }: Props) {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [uploadLink, setUploadLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Load submission status on component mount
  useEffect(() => {
    loadSubmissionStatus();
  }, [assignment.id, assignment._id]);

  const loadSubmissionStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const assignmentId = assignment.id || assignment._id;
      if (!assignmentId) return;

      const response = await submissionsApi.getMySubmissionStatus(assignmentId);
      setSubmissionStatus(response as SubmissionStatus);
    } catch (error) {
      console.error("Failed to load submission status:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

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

      const assignmentId = assignment.id || assignment._id;
      if (!assignmentId) {
        toast({
          title: "Error",
          description:
            "Assignment id is missing. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }

      // Validation: require either answers or upload link for upload-type assignments
      if (
        assignment.type === "upload" &&
        !uploadLink.trim() &&
        Object.keys(answers).length === 0
      ) {
        toast({
          title: "Submission incomplete",
          description:
            "Please provide a file link or answer the questions before submitting.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const submissionData = {
        assignmentId,
        answers,
        uploadLink: uploadLink.trim() || undefined,
      };

      const newSubmission = await submissionsApi.create(submissionData);
      toast({
        title: "Assignment submitted",
        description: "Your assignment has been submitted successfully.",
      });
      
      // Reload submission status
      await loadSubmissionStatus();
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
      {/* Grading Status Alert */}
      {!isLoadingStatus && submissionStatus?.submitted && (
        <Alert className={submissionStatus?.grade?.status === 'graded' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
          <div className="flex items-start gap-3">
            {submissionStatus?.grade?.status === 'graded' ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <AlertDescription className="text-green-900">
                    <p className="font-semibold">Results Posted</p>
                    <p className="text-sm">
                      Your assignment has been graded: <span className="font-bold text-lg">{submissionStatus?.grade?.score}/{submissionStatus?.grade?.maxScore}</span>
                    </p>
                    {submissionStatus?.grade?.feedback && (
                      <p className="text-sm mt-2"><strong>Feedback:</strong> {submissionStatus.grade.feedback}</p>
                    )}
                  </AlertDescription>
                </div>
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <AlertDescription className="text-yellow-900">
                    <p className="font-semibold">Results Pending</p>
                    <p className="text-sm">Your assignment has been submitted and is awaiting grading.</p>
                  </AlertDescription>
                </div>
              </>
            )}
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>{assignment.title}</CardTitle>
            {submissionStatus?.submitted && (
              <Badge variant={submissionStatus?.grade?.status === 'graded' ? 'default' : 'secondary'}>
                {submissionStatus?.grade?.status === 'graded' ? 'Graded' : 'Submitted'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Instructions</Label>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {assignment.instructions}
            </p>
          </div>

          {/* Show submission form only if not yet submitted */}
          {!submissionStatus?.submitted ? (
            <>
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

              {/* File Upload Section - Always visible for document attachments */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">
                      {assignment.type === "upload"
                        ? "File Submission (Required)"
                        : "Attach Supporting Documents (Optional)"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="file-link" className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Document Link
                    </Label>
                    <Input
                      id="file-link"
                      value={uploadLink}
                      onChange={(e) => setUploadLink(e.target.value)}
                      placeholder="https://drive.google.com/file/... or https://onedrive.live.com/..."
                      className="mt-2"
                    />
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>
                        Upload your file to Google Drive, OneDrive, or Dropbox, then
                        paste the shareable link above. Make sure the link
                        permissions are set to "Anyone with the link can view".
                      </span>
                    </p>
                    <p className="font-medium text-primary">
                      Supported formats: PDF, DOCX, PPTX, Images, Videos
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  data-testid="button-submit-assignment"
                  size="lg"
                  className="min-w-[200px]"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  {isSubmitting ? "Submitting..." : "Submit Assignment"}
                </Button>
              </div>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have already submitted this assignment. {submissionStatus?.grade?.status === 'pending' && 'Awaiting tutor grading.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
