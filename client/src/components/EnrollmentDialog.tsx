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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
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
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const handleEnrollStudent = async () => {
    if (studentEmail.trim()) {
      setIsLoading(true);
      try {
        // API call to enroll a student by email
        const response = await fetch("/api/enrollments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId,
            studentEmail,
            enrolledBy: userRole,
          }),
        });

        if (response.ok) {
          toast({
            title: "Student Enrolled Successfully",
            description: `Student with email ${studentEmail} has been enrolled in ${courseTitle}.`,
          });
          setStudentEmail("");
          onEnrollmentComplete?.();
        } else {
          const error = await response.json();
          toast({
            title: "Error Enrolling Student",
            description: error.error || "Failed to enroll student. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error enrolling student:", error);
        toast({
          title: "Error Enrolling Student",
          description: "Network error. Please check your connection and try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBulkEnroll = async () => {
    if (selectedStudents.length > 0) {
      setIsLoading(true);
      try {
        // API call to enroll multiple students
        const response = await fetch("/api/enrollments/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId,
            studentIds: selectedStudents,
            enrolledBy: userRole,
          }),
        });

        if (response.ok) {
          toast({
            title: "Students Enrolled Successfully",
            description: `${selectedStudents.length} students have been enrolled in ${courseTitle}.`,
          });
          setSelectedStudents([]);
          onEnrollmentComplete?.();
          setIsOpen(false);
        } else {
          const error = await response.json();
          toast({
            title: "Error Enrolling Students",
            description: error.error || "Failed to enroll students. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error enrolling students:", error);
        toast({
          title: "Error Enrolling Students",
          description: "Network error. Please check your connection and try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

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

            <div className="space-y-2">
              <Label>Bulk Enrollment</Label>
              <Select 
                onValueChange={(value) => {
                  if (!selectedStudents.includes(value)) {
                    setSelectedStudents([...selectedStudents, value]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student1@example.com">John Doe (student1@example.com)</SelectItem>
                  <SelectItem value="student2@example.com">Jane Smith (student2@example.com)</SelectItem>
                  <SelectItem value="student3@example.com">David Mwangi (student3@example.com)</SelectItem>
                </SelectContent>
              </Select>

              {selectedStudents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>Selected Students ({selectedStudents.length})</Label>
                  <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                    <ul className="space-y-1">
                      {selectedStudents.map((student, index) => (
                        <li key={index} className="flex justify-between items-center text-sm">
                          <span>{student}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStudents(selectedStudents.filter(s => s !== student));
                            }}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <Button 
                className="w-full mt-2" 
                onClick={handleBulkEnroll}
                disabled={isLoading || selectedStudents.length === 0}
              >
                Enroll Selected Students
              </Button>
            </div>
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