import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// bulk-select removed — single-email enrollment only
import { toast } from "@/hooks/use-toast";
import { coursesApi } from "@/lib/api";
import { UserPlus } from "lucide-react";

interface EnrollmentDialogProps {
  courseId: string;
  courseTitle: string;
  onEnrollmentComplete?: () => void;
  userRole: "tutor" | "admin";
}

export function EnrollmentDialog({
  courseId,
  courseTitle,
  onEnrollmentComplete,
  userRole,
}: EnrollmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  // removed bulk selection; only single studentEmail is supported now

  const handleEnrollStudent = async () => {
    // quick client-side auth guard so we don't send unauthenticated requests
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in as a tutor or admin before enrolling students.',
        variant: 'destructive',
      });
      return;
    }
    if (studentEmail.trim()) {
      setIsLoading(true);
      try {
        // Use coursesApi.enroll which attaches auth header and calls POST /courses/:id/enroll
        const resp: any = await coursesApi.enroll(courseId, [studentEmail]);

        toast({
          title: "Student Enrolled Successfully",
          description: `Student with email ${studentEmail} has been enrolled in ${courseTitle}.`,
        });
        setStudentEmail("");
        onEnrollmentComplete?.();
      } catch (error: any) {
        console.error("Error enrolling student:", error);
        toast({
          title: "Error Enrolling Student",
          description: (error && error.message) || "Failed to enroll student. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // bulk enrollment removed — see single email enrollment

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" data-testid="button-manage-enrollment">
          Manage Enrollments
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Manage Course Enrollments
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Course: {courseTitle}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Enroll students in this course
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-email">Enroll by Email</Label>
              <div className="flex gap-2">
                <Input
                  id="student-email"
                  placeholder="Enter student email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleEnrollStudent} 
                  disabled={isLoading || !studentEmail.trim()}
                >
                  Enroll
                </Button>
              </div>
            </div>

            {/* Bulk enrollment removed — single email enrollment only */}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}