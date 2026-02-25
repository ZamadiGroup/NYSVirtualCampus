import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { assignmentsApi, submissionsApi } from "@/lib/api";
import { BookOpen, Users, Settings, BarChart3, AlertCircle } from "lucide-react";

type Props = {
  assignmentId: string | undefined;
};

export default function TutorAssignmentReview({ assignmentId }: Props) {
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, graded: 0, pending: 0 });

  useEffect(() => {
    if (!assignmentId) return;
    loadAssignmentDetails();
  }, [assignmentId]);

  const loadAssignmentDetails = async () => {
    try {
      setIsLoading(true);
      // Fetch assignment
      const assignments = await assignmentsApi.getAll();
      const found = Array.isArray(assignments) ? assignments.find((a: any) => a._id === assignmentId || a.id === assignmentId) : null;
      if (found) {
        setAssignment(found);
      }

      // Fetch submissions for this assignment
      const subs: any = await submissionsApi.getAll({
        assignmentId,
        limit: 100
      });

      if (subs && subs.items && Array.isArray(subs.items)) {
        setSubmissions(subs.items);
        
        // Calculate stats
        const graded = subs.items.filter((s: any) => s.grade?.status === 'graded').length;
        const pending = subs.items.filter((s: any) => !s.grade || s.grade?.status === 'pending').length;
        
        setStats({
          total: subs.items.length,
          graded,
          pending
        });
      }
    } catch (error) {
      console.error('Failed to load assignment details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignment details',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading assignment details...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Assignment not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <p className="text-m text-muted-foreground mt-2">{assignment.instructions}</p>
            </div>
            <Badge variant={assignment.type === 'auto' ? 'default' : 'secondary'}>
              {assignment.type === 'auto' ? 'Auto-Graded Quiz' : 'File Submission'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Graded</p>
                <p className="text-3xl font-bold text-green-600">{stats.graded}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Details Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">
            <BookOpen className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <Users className="h-4 w-4 mr-2" />
            Submissions ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="text-base">{assignment.type === 'auto' ? 'Auto-Graded Quiz' : 'File Upload'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max Score</p>
                  <p className="text-base">{assignment.maxScore || 100} points</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                  <p className="text-base">{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No deadline'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={assignment.isActive ? 'default' : 'secondary'}>
                    {assignment.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {assignment.type === 'auto' && assignment.questions && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Questions ({assignment.questions.length})</h4>
                  <div className="space-y-2">
                    {assignment.questions.map((q: any, idx: number) => (
                      <div key={idx} className="text-sm bg-muted p-2 rounded">
                        <p className="font-medium">Q{idx + 1}: {q.text}</p>
                        {q.correctAnswer && (
                          <p className="text-xs text-green-600">Correct: {q.correctAnswer}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          {submissions.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No submissions yet</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {submissions.map((submission: any) => (
                <Card key={submission._id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{submission.student?.fullName || 'Unknown Student'}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted: {new Date(submission.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {submission.grade ? (
                          <div>
                            <Badge className="mb-2">Graded</Badge>
                            <p className="text-sm font-semibold">{submission.grade.score}/{submission.grade.maxScore}</p>
                          </div>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  To modify assignment settings, use the Edit button from the assignments list.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">Edit Assignment</Button>
                <Button variant="outline" className="w-full">Download Submissions</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
