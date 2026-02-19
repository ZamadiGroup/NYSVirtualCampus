import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Users,
  BookOpen,
  FileText,
  Trash2,
  Edit,
  Upload,
  FileIcon,
} from "lucide-react";
import {
  coursesApi,
  assignmentsApi,
  uploadsApi,
  announcementsApi,
  usersApi,
  enrollmentsApi,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import TutorCoursesGrid from "@/components/TutorCoursesGrid";
import CreateAssignment, { AssignmentDraft } from "./CreateAssignment";
import CreateCourse from "./CreateCourse";

function parseJwt(token?: string | null) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return decoded;
  } catch (e) {
    return null;
  }
}

type TutorDashboardProps = {
  onNavigate?: (page: string) => void;
  onOpenCourse?: (id: string) => void;
  onOpenAssignment?: (id: string) => void;
  onAddAssignment?: (a: any) => void;
  onUpdateAssignment?: (a: any) => void;
  onDeleteAssignment?: (id: string) => void;
  assignmentsFromApp?: any[];
  onAssignmentsChange?: (a: any[]) => void;
  initialTab?: string;
  showHeader?: boolean;
  hideAssignments?: boolean;
  hideStudents?: boolean;
  hideCourses?: boolean;
  hideContent?: boolean;
  hideAnnouncements?: boolean;
};

export default function TutorDashboard({
  onNavigate,
  onOpenCourse,
  onOpenAssignment,
  onAddAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  assignmentsFromApp,
  onAssignmentsChange,
  initialTab,
  showHeader = true,
  hideAssignments = false,
  hideStudents = false,
  hideCourses = false,
  hideContent = false,
  hideAnnouncements = false,
}: TutorDashboardProps) {
  const [courses, setCourses] = useState<any[]>([]);

  const [students, setStudents] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDraft[]>([]);

  const [modules, setModules] = useState<any[]>([]);

  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [editCourseDraft, setEditCourseDraft] = useState<any | null>(null);
  const [isEnrollStudentOpen, setIsEnrollStudentOpen] = useState(false);
  const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false);
  const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementFilterCourse, setAnnouncementFilterCourse] = useState<
    string | undefined
  >(undefined);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] =
    useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    courseId: "",
    isGlobal: false,
  });

  const [newModule, setNewModule] = useState({
    courseId: "",
    title: "",
    chapterTitle: "",
    notes: "",
    files: [] as File[],
    pptLink: "",
  });

  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false);
  const [editAssignmentDraft, setEditAssignmentDraft] =
    useState<AssignmentDraft | null>(null);

  const { toast } = useToast();

  const [bulkTransfer, setBulkTransfer] = useState({
    fromCourse: "",
    toCourse: "",
    students: [] as string[],
  });
  const [bulkSearch, setBulkSearch] = useState("");
  const [bulkToSearch, setBulkToSearch] = useState("");
  const [isConfirmBulkOpen, setIsConfirmBulkOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const [enrollStudent, setEnrollStudent] = useState({
    courseId: "",
    email: "",
    name: "",
  });

  // assignments filter (by course) for the Assignments tab
  const [assignmentCourseFilter, setAssignmentCourseFilter] = useState<string>(
    () => {
      try {
        if (typeof window !== "undefined")
          return window.localStorage.getItem("assignmentCourseFilter") || "all";
      } catch (e) {}
      return "all";
    },
  );

  // deadline filter: all | upcoming | past | noduedate
  const [assignmentDeadlineFilter, setAssignmentDeadlineFilter] =
    useState<string>("all");

  // determine current user (role) so we can hide deadline from students and show edit/delete only to tutors/admins
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  const currentUser = parseJwt(token) as any;

  const handleCreateModule = async () => {
    if (!newModule.courseId) {
      alert("Please select a course");
      return;
    }

    try {
      // If files were selected, upload them first and collect returned URLs
      const uploadedUrls: string[] = [];
      if (newModule.files && newModule.files.length > 0) {
        for (const f of newModule.files) {
          try {
            const res = await uploadsApi.upload(f);
            if (res && res.url) uploadedUrls.push(res.url);
          } catch (err) {
            console.error("File upload failed", err);
            // continue with other files; optionally notify user
          }
        }
      }

      const chapter = {
        id: `${Date.now()}-1`,
        title: newModule.chapterTitle,
        notes: newModule.notes,
        files: uploadedUrls,
        pptLinks: newModule.pptLink ? [newModule.pptLink] : [],
      };

      const newModuleData = {
        id: Date.now().toString(),
        courseId: newModule.courseId,
        title: newModule.title,
        chapters: [chapter],
      };

      setModules([...modules, newModuleData]);
      setNewModule({
        courseId: "",
        title: "",
        chapterTitle: "",
        notes: "",
        files: [],
        pptLink: "",
      });
      setIsCreateModuleOpen(false);
      toast({
        title: "Module created",
        description: "Module and chapter created successfully.",
      });
    } catch (err) {
      console.error("Create module failed", err);
      toast({
        title: "Create failed",
        description:
          err instanceof Error ? err.message : "Failed to create module",
        variant: "destructive",
      });
    }
  };

  const handleEnrollStudent = async () => {
    if (!enrollStudent.courseId) {
      alert("Please select a course");
      return;
    }
    if (!enrollStudent.email) {
      alert("Please enter student email");
      return;
    }

    try {
      // Call API to enroll student by email
      await coursesApi.enroll(enrollStudent.courseId, [enrollStudent.email]);

      toast({
        title: "Student enrolled",
        description: `Successfully enrolled ${enrollStudent.email}`,
      });

      // Reload enrollments to update the UI
      const res = await enrollmentsApi.getAll();
      const raw = Array.isArray(res) ? res : [];
      const es = raw.map((e: any) => ({
        _id: e._id,
        id: String(e._id || e.id),
        studentId: e.studentId?._id
          ? String(e.studentId._id)
          : String(e.studentId || ""),
        courseId: e.courseId?._id
          ? String(e.courseId._id)
          : String(e.courseId || ""),
        studentName:
          e.studentId?.fullName ||
          e.studentId?.name ||
          e.studentId?.username ||
          "",
        studentEmail: e.studentId?.email || "",
        enrolledAt: e.enrolledAt,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      }));
      setEnrollments(es);

      setEnrollStudent({ courseId: "", email: "", name: "" });
      setIsEnrollStudentOpen(false);
    } catch (error: any) {
      console.error("Failed to enroll student:", error);
      toast({
        title: "Enrollment failed",
        description: error.message || "Failed to enroll student",
        variant: "destructive",
      });
    }
  };

  const handleBulkTransfer = async () => {
    if (
      !bulkTransfer.fromCourse ||
      !bulkTransfer.toCourse ||
      bulkTransfer.students.length === 0
    ) {
      toast({
        title: "Invalid request",
        description: "Select source, destination and at least one student",
        variant: "destructive",
      });
      return;
    }

    const fromCourseObj = courses.find((c) => c.id === bulkTransfer.fromCourse);
    const toCourseObj = courses.find((c) => c.id === bulkTransfer.toCourse);
    const confirmMsg = `Transfer ${bulkTransfer.students.length} student(s) from "${fromCourseObj?.title || bulkTransfer.fromCourse}" to "${toCourseObj?.title || bulkTransfer.toCourse}"?`;
    // Open confirmation dialog with computed message
    setConfirmMsg(confirmMsg);
    setIsConfirmBulkOpen(true);
  };

  const doConfirmTransfer = async () => {
    setIsConfirmBulkOpen(false);
    setIsTransferring(true);
    try {
      const res: any = await coursesApi.bulkTransfer({
        fromCourseId: bulkTransfer.fromCourse,
        toCourseId: bulkTransfer.toCourse,
        studentIds: bulkTransfer.students,
      });
      // optimistic local update: update enrollments so UI reflects the transfer
      setEnrollments((prev) => {
        // Remove old enrollments for transferred students in the source course
        const filtered = prev.filter(
          (e) =>
            !(
              String(e.courseId) === String(bulkTransfer.fromCourse) &&
              bulkTransfer.students.includes(String(e.studentId))
            ),
        );
        // Add new enrollments for transferred students in the destination course
        const newEnrollments = bulkTransfer.students.map((studentId) => {
          const student = students.find(
            (s) => String(s.id) === String(studentId),
          );
          return {
            studentId: String(studentId),
            courseId: String(bulkTransfer.toCourse),
            studentName: student?.name || student?.username || "",
            studentEmail: student?.email || "",
          };
        });
        return [...filtered, ...newEnrollments];
      });
      toast({
        title: "Transfer complete",
        description: `Transferred ${res.results?.transferred?.length || bulkTransfer.students.length} students.`,
      });
      setIsBulkTransferOpen(false);
      setBulkTransfer({ fromCourse: "", toCourse: "", students: [] });
    } catch (err) {
      console.error("Bulk transfer failed", err);
      toast({
        title: "Transfer failed",
        description:
          err instanceof Error ? err.message : "Bulk transfer failed",
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, courseId: string) => {
    if (confirm("Remove this student from the course?")) {
      try {
        // Remove the enrollment from the database
        await enrollmentsApi.delete(courseId, studentId);

        // Remove from local state
        setEnrollments((prev) =>
          prev.filter(
            (e) =>
              !(
                String(e.studentId) === String(studentId) &&
                String(e.courseId) === String(courseId)
              ),
          ),
        );

        toast({
          title: "Student removed",
          description: "Student has been removed from the course",
        });
      } catch (error: any) {
        console.error("Failed to remove student:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to remove student",
          variant: "destructive",
        });
      }
    }
  };

  const handleRemoveAssignment = (assignmentId?: string) => {
    if (!assignmentId) return;
    if (!confirm("Delete this assignment?")) return;
    (async () => {
      try {
        await assignmentsApi.delete(assignmentId);
        setAssignments((prev) =>
          prev.filter(
            (a) =>
              (a as any).id !== assignmentId && (a as any)._id !== assignmentId,
          ),
        );
        if (onDeleteAssignment) onDeleteAssignment(assignmentId);
        toast({
          title: "Assignment deleted",
          description: "Assignment was removed.",
        });
      } catch (err) {
        // fallback: remove locally if API not available
        setAssignments((prev) =>
          prev.filter(
            (a) =>
              (a as any).id !== assignmentId && (a as any)._id !== assignmentId,
          ),
        );
        if (onDeleteAssignment) onDeleteAssignment(assignmentId);
        toast({
          title: "Delete failed",
          description: err instanceof Error ? err.message : "Failed to delete",
          variant: "destructive",
        });
      }
    })();
  };

  const handleDeleteCourse = (courseId?: string) => {
    if (!courseId) return;
    if (
      !confirm(
        "Delete this course? This will remove enrollments and assignments.",
      )
    )
      return;
    (async () => {
      try {
        await coursesApi.delete(courseId);
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
        toast({ title: "Course deleted", description: "Course was deleted." });
      } catch (err) {
        toast({
          title: "Delete failed",
          description:
            err instanceof Error ? err.message : "Failed to delete course",
          variant: "destructive",
        });
      }
    })();
  };

  const handleDeleteAnnouncement = (announcementId?: string) => {
    if (!announcementId) return;
    if (!confirm("Delete this announcement?")) return;
    (async () => {
      try {
        await announcementsApi.delete(announcementId);
        setAnnouncements((prev) =>
          prev.filter((a) => (a.id || a._id) !== announcementId),
        );
        toast({
          title: "Announcement deleted",
          description: "Announcement removed.",
        });
      } catch (err) {
        toast({
          title: "Delete failed",
          description:
            err instanceof Error
              ? err.message
              : "Failed to delete announcement",
          variant: "destructive",
        });
      }
    })();
  };

  const handleEditCourseSave = async () => {
    if (!editCourseDraft) return;
    try {
      // call API if id exists
      if (editCourseDraft.id) {
        await coursesApi.update(editCourseDraft.id, {
          title: editCourseDraft.title,
          department: editCourseDraft.department,
          description: editCourseDraft.description,
        });
      }
      setCourses((prev) =>
        prev.map((c) =>
          c.id === editCourseDraft.id ? { ...c, ...editCourseDraft } : c,
        ),
      );
      setIsEditCourseOpen(false);
      setEditCourseDraft(null);
      toast({
        title: "Course updated",
        description: "Course details were updated.",
      });
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Failed to update",
        variant: "destructive",
      });
    }
  };

  const handleEditAssignmentSave = async () => {
    if (!editAssignmentDraft || !editAssignmentDraft.id) return;
    try {
      await assignmentsApi.update(editAssignmentDraft.id, editAssignmentDraft);
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === editAssignmentDraft.id
            ? { ...a, ...editAssignmentDraft }
            : a,
        ),
      );
      setIsEditAssignmentOpen(false);
      setEditAssignmentDraft(null);
      toast({
        title: "Assignment updated",
        description: "Assignment updated successfully.",
      });
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Failed to update",
        variant: "destructive",
      });
    }
  };

  // Get students enrolled in a specific course using enrollments data
  const getStudentsForCourse = (courseId: string) => {
    // Get enrolled student IDs for this course
    const enrolledStudentIds = enrollments
      .filter((e) => String(e.courseId) === String(courseId))
      .map((e) => String(e.studentId));
    // Return students that are enrolled in this course
    return students.filter((s) => enrolledStudentIds.includes(String(s.id)));
  };
  // Simplified and robust matching: coerce both sides to strings. assignments[].courseId is normalized when assignments are loaded.
  const getAssignmentsForCourse = (courseId: string) =>
    assignments.filter((a) => {
      if (!a) return false;
      try {
        return String((a as any).courseId || "") === String(courseId || "");
      } catch (e) {
        return false;
      }
    });
  const getModulesForCourse = (courseId: string) =>
    modules.filter((m) => m.courseId === courseId);

  // Load all courses and all students so tutors can access every student in the system
  React.useEffect(() => {
    let mounted = true;

    // load all courses (for bulk transfer selection)
    coursesApi
      .getAll()
      .then((res: any) => {
        if (!mounted) return;
        const raw = Array.isArray(res) ? res : [];
        // normalize course id to string to avoid mismatches with ObjectId or populated shapes
        const cs = raw.map((c: any) => ({
          ...(c || {}),
          id: String(c.id || c._id),
        }));
        setAllCourses(cs);
      })
      .catch(() => {});

    // load students (tutors/admins can fetch all students)
    usersApi
      .getStudents()
      .then((res: any) => {
        if (!mounted) return;
        const raw = Array.isArray(res) ? res : [];
        // normalize student id to string
        const us = raw.map((u: any) => ({
          ...(u || {}),
          id: String(u.id || u._id),
        }));
        setStudents(us);
      })
      .catch(() => {});

    // load enrollments (tutors/admins can see which students are in which courses)
    enrollmentsApi
      .getAll()
      .then((res: any) => {
        if (!mounted) return;
        const raw = Array.isArray(res) ? res : [];
        // normalize enrollment ids - explicitly construct to avoid React rendering object errors
        const es = raw.map((e: any) => ({
          _id: e._id,
          id: String(e._id || e.id),
          studentId: e.studentId?._id
            ? String(e.studentId._id)
            : String(e.studentId || ""),
          courseId: e.courseId?._id
            ? String(e.courseId._id)
            : String(e.courseId || ""),
          studentName:
            e.studentId?.fullName ||
            e.studentId?.name ||
            e.studentId?.username ||
            "",
          studentEmail: e.studentId?.email || "",
          enrolledAt: e.enrolledAt,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
        }));
        setEnrollments(es);
      })
      .catch(() => {});

    // Also fetch the current tutor's own courses for the My Courses tab
    (async () => {
      try {
        const mine = await coursesApi.getMine();
        if (!mounted) return;
        const raw = Array.isArray(mine) ? mine : [];
        // normalize course id to string
        setCourses(
          raw.map((c: any) => ({ ...(c || {}), id: String(c.id || c._id) })),
        );
        // fetch assignments so counts are accurate
        try {
          const allAssignments = await assignmentsApi.getAll();
          if (!mounted) return;
          const list = Array.isArray(allAssignments) ? allAssignments : [];
          // normalize id fields and ensure courseId is a string for reliable matching
          setAssignments(
            list.map((a: any) => {
              const normalizedCourseId =
                a && a.courseId
                  ? typeof a.courseId === "object"
                    ? String(a.courseId.id || a.courseId._id || a.courseId)
                    : String(a.courseId)
                  : "";
              return {
                ...(a || {}),
                id: String(a.id || a._id),
                courseId: normalizedCourseId,
              };
            }) as any,
          );
        } catch (e) {
          // ignore assignment load failures
        }
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Validate assignmentCourseFilter - reset to "all" if stored course doesn't exist
  React.useEffect(() => {
    if (assignmentCourseFilter !== "all" && courses.length > 0) {
      const exists = courses.some(
        (c) => String(c.id) === String(assignmentCourseFilter),
      );
      if (!exists) {
        setAssignmentCourseFilter("all");
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem("assignmentCourseFilter", "all");
          }
        } catch (e) {}
      }
    }
  }, [courses, assignmentCourseFilter]);

  const fetchAnnouncements = async (courseId?: string) => {
    try {
      const res = await announcementsApi.getAll(courseId, undefined as any);
      setAnnouncements(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    }
  };

  // load announcements on mount
  React.useEffect(() => {
    fetchAnnouncements();
  }, []);

  const defaultTab =
    initialTab ||
    (hideCourses
      ? hideAssignments
        ? hideStudents
          ? hideContent
            ? hideAnnouncements
              ? ""
              : "announcements"
            : "content"
          : "students"
        : "assignments"
      : "courses");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        {showHeader ? (
          <div>
            <h1 className="text-3xl font-bold mb-2">Facilitator Dashboard</h1>
            <p className="text-muted-foreground">
              Manage courses, students, content, and assignments
            </p>
          </div>
        ) : (
          <div />
        )}
        {(showHeader || defaultTab === "courses") && (
          <Dialog
            open={isCreateCourseOpen}
            onOpenChange={setIsCreateCourseOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
              </DialogHeader>
              <div className="pt-2">
                <CreateCourse
                  onCancel={() => setIsCreateCourseOpen(false)}
                  onCreated={(course) => {
                    // Append created course to local dashboard state so it appears immediately
                    setCourses((prev) => [...prev, course as any]);
                    setIsCreateCourseOpen(false);
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      {/* Calculate total enrolled students from enrollments in tutor's courses */}
      {(() => {
        const courseIds = courses.map((c) => String(c.id));
        const enrolledInMyCourses = enrollments.filter((e) =>
          courseIds.includes(String(e.courseId)),
        );
        // Get unique students (a student may be enrolled in multiple courses)
        const uniqueStudentIds = Array.from(
          new Set(enrolledInMyCourses.map((e) => String(e.studentId))),
        );
        const totalEnrolledStudents = uniqueStudentIds.length;

        return (
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      my courses
                    </p>
                    <p className="text-2xl font-bold">{courses.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      students
                    </p>
                    <p className="text-2xl font-bold">
                      {totalEnrolledStudents}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      my assignments
                    </p>
                    <p className="text-2xl font-bold">{assignments.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Main Content Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          {!hideCourses && (
            <TabsTrigger value="courses">My Courses</TabsTrigger>
          )}
          {!hideAssignments && (
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          )}
          {!hideStudents && (
            <TabsTrigger value="students">Students</TabsTrigger>
          )}
          {!hideContent && (
            <TabsTrigger value="content">Course Content</TabsTrigger>
          )}
          {!hideAnnouncements && (
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          )}
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      <button
                        className="text-left hover:underline"
                        onClick={() => {
                          if (onOpenCourse) onOpenCourse(course.id);
                        }}
                      >
                        {course.title}
                      </button>
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {course.description}
                    </p>
                    <Badge variant="outline">{course.department}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditCourseDraft(course);
                        setIsEditCourseOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {/* Per-course quick-stats removed by request */}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Assignments Tab */}
        {!hideAssignments && (
          <TabsContent value="assignments" className="space-y-4">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Label className="text-sm">Filter by Course</Label>
                <Select
                  value={assignmentCourseFilter}
                  onValueChange={(v) => {
                    setAssignmentCourseFilter(v);
                    try {
                      if (typeof window !== "undefined")
                        window.localStorage.setItem(
                          "assignmentCourseFilter",
                          v,
                        );
                    } catch (e) {}
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <Label className="text-sm">Deadline</Label>
                  <Select
                    value={assignmentDeadlineFilter}
                    onValueChange={(v) => setAssignmentDeadlineFilter(v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                      <SelectItem value="no-deadline">No deadline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Dialog
                open={isCreateAssignmentOpen}
                onOpenChange={setIsCreateAssignmentOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                  </DialogHeader>
                  {/* Use the centralized CreateAssignment component so creation uses api/toast logic */}
                  <CreateAssignment
                    onCancel={() => setIsCreateAssignmentOpen(false)}
                    onCreated={(assignment) => {
                      // Normalize the assignment so courseId is a string for matching
                      const normalizedCourseId =
                        assignment && assignment.courseId
                          ? typeof assignment.courseId === "object"
                            ? String(
                                (assignment.courseId as any).id ||
                                  (assignment.courseId as any)._id ||
                                  assignment.courseId,
                              )
                            : String(assignment.courseId)
                          : "";
                      const normalizedAssignment = {
                        ...assignment,
                        id: String(
                          (assignment as any).id || (assignment as any)._id,
                        ),
                        courseId: normalizedCourseId,
                      };
                      setAssignments((prev) => [...prev, normalizedAssignment]);
                      if (onAddAssignment)
                        onAddAssignment(normalizedAssignment);
                      setIsCreateAssignmentOpen(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {(assignmentCourseFilter === "all"
                ? courses
                : courses.filter(
                    (c) => String(c.id) === String(assignmentCourseFilter),
                  )
              ).map((course) => {
                const courseAssignmentsRaw = getAssignmentsForCourse(course.id);
                const now = new Date();
                const hasDue = (a: any) => {
                  try {
                    return (
                      !!a &&
                      !!a.dueDate &&
                      !isNaN(new Date(a.dueDate).getTime())
                    );
                  } catch (e) {
                    return false;
                  }
                };
                const isPast = (a: any) =>
                  hasDue(a) && new Date(a.dueDate).getTime() < now.getTime();

                // apply deadline filter
                let courseAssignments = courseAssignmentsRaw.filter(
                  (a: any) => {
                    if (!a) return false;
                    if (assignmentDeadlineFilter === "upcoming")
                      return hasDue(a) && !isPast(a);
                    if (assignmentDeadlineFilter === "past") return isPast(a);
                    if (assignmentDeadlineFilter === "no-deadline")
                      return !hasDue(a);
                    return true;
                  },
                );

                // when showing all, sort: upcoming (future) first, then no-deadline, then past
                if (assignmentDeadlineFilter === "all") {
                  const rank = (a: any) => {
                    if (!a) return 1;
                    if (!hasDue(a)) return 1;
                    return isPast(a) ? 2 : 0;
                  };
                  courseAssignments = courseAssignments
                    .slice()
                    .sort((a: any, b: any) => {
                      const ra = rank(a),
                        rb = rank(b);
                      if (ra !== rb) return ra - rb;
                      const da = hasDue(a) ? new Date(a.dueDate).getTime() : 0;
                      const db = hasDue(b) ? new Date(b.dueDate).getTime() : 0;
                      return (da || 0) - (db || 0);
                    });
                } else {
                  // otherwise sort by due date ascending when available
                  courseAssignments = courseAssignments
                    .slice()
                    .sort((a: any, b: any) => {
                      const da = hasDue(a) ? new Date(a.dueDate).getTime() : 0;
                      const db = hasDue(b) ? new Date(b.dueDate).getTime() : 0;
                      return (da || 0) - (db || 0);
                    });
                }
                return (
                  <Card key={course.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {course.title} - Assignments ({courseAssignments.length}
                        )
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {courseAssignments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No assignments yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {courseAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="p-3 border rounded-lg flex justify-between items-start"
                            >
                              <div className="flex-1">
                                <p className="font-medium">
                                  {assignment.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {assignment.type === "upload"
                                    ? "File Submission"
                                    : "Auto-graded Quiz"}
                                </p>
                                {!(
                                  currentUser && currentUser.role === "student"
                                ) ? (
                                  <p className="text-xs text-muted-foreground">
                                    Due: {assignment.dueDate}
                                  </p>
                                ) : // students should only see title; hide due date
                                null}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (onOpenAssignment && assignment.id) {
                                      onOpenAssignment(assignment.id);
                                    } else {
                                      setEditAssignmentDraft(assignment);
                                      setIsEditAssignmentOpen(true);
                                    }
                                  }}
                                  title="Open assignment"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                {currentUser &&
                                  (currentUser.role === "tutor" ||
                                    currentUser.role === "admin") && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setEditAssignmentDraft(assignment);
                                          setIsEditAssignmentOpen(true);
                                        }}
                                        title="Edit"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          handleRemoveAssignment(
                                            assignment.id ||
                                              (assignment as any)._id,
                                          )
                                        }
                                        title="Delete"
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        )}

        {/* Students Tab */}
        {!hideStudents && (
          <TabsContent value="students" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Dialog
                open={isEnrollStudentOpen}
                onOpenChange={setIsEnrollStudentOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Enroll Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enroll Student</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Course</Label>
                      <Select
                        value={enrollStudent.courseId}
                        onValueChange={(value) =>
                          setEnrollStudent({
                            ...enrollStudent,
                            courseId: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Student Name</Label>
                      <Input
                        value={enrollStudent.name}
                        onChange={(e) =>
                          setEnrollStudent({
                            ...enrollStudent,
                            name: e.target.value,
                          })
                        }
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <Label>Student Email</Label>
                      <Input
                        type="email"
                        value={enrollStudent.email}
                        onChange={(e) =>
                          setEnrollStudent({
                            ...enrollStudent,
                            email: e.target.value,
                          })
                        }
                        placeholder="student@example.com"
                      />
                    </div>
                    <Button onClick={handleEnrollStudent} className="w-full">
                      Enroll Student
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isBulkTransferOpen}
                onOpenChange={setIsBulkTransferOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">Bulk Transfer</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Bulk Transfer Students</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label>From Course</Label>
                      <div className="flex gap-2">
                        <Input
                          className="flex-1"
                          placeholder="Search courses..."
                          value={bulkSearch}
                          onChange={(e) => setBulkSearch(e.target.value)}
                        />
                        <Select
                          value={bulkTransfer.fromCourse}
                          onValueChange={(value) => {
                            const picked = courses.find(
                              (c) => (c.id || c._id) === value,
                            );
                            setBulkTransfer({
                              ...bulkTransfer,
                              fromCourse: value,
                              students: [],
                            });
                            setBulkSearch(picked?.title || "");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64 overflow-y-auto">
                            {courses
                              .filter((c) =>
                                c.title
                                  .toLowerCase()
                                  .includes(bulkSearch.toLowerCase()),
                              )
                              .map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.title}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>To Course</Label>
                      <div className="flex gap-2">
                        <Input
                          className="flex-1"
                          placeholder="Search courses..."
                          value={bulkToSearch}
                          onChange={(e) => setBulkToSearch(e.target.value)}
                        />
                        <Select
                          value={bulkTransfer.toCourse}
                          onValueChange={(value) => {
                            const picked = courses.find(
                              (c) => (c.id || c._id) === value,
                            );
                            setBulkTransfer({
                              ...bulkTransfer,
                              toCourse: value,
                            });
                            setBulkToSearch(picked?.title || "");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64 overflow-y-auto">
                            {courses
                              .filter(
                                (c) =>
                                  c.id !== bulkTransfer.fromCourse &&
                                  c.title
                                    .toLowerCase()
                                    .includes(bulkToSearch.toLowerCase()),
                              )
                              .map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.title}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {bulkTransfer.fromCourse && (
                      <div>
                        <Label>Select Students to Transfer</Label>
                        <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                          {/* Select all checkbox */}
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="rounded"
                              disabled={
                                getStudentsForCourse(bulkTransfer.fromCourse)
                                  .length === 0
                              }
                              checked={
                                // checked when every visible student id is present in bulkTransfer.students
                                (() => {
                                  const visible = getStudentsForCourse(
                                    bulkTransfer.fromCourse,
                                  ).map((s) => s.id);
                                  return (
                                    visible.length > 0 &&
                                    visible.every((id) =>
                                      bulkTransfer.students.includes(id),
                                    )
                                  );
                                })()
                              }
                              onChange={(e) => {
                                const visible = getStudentsForCourse(
                                  bulkTransfer.fromCourse,
                                ).map((s) => s.id);
                                if (e.target.checked) {
                                  // add all visible ids (avoid duplicates)
                                  const merged = Array.from(
                                    new Set([
                                      ...bulkTransfer.students,
                                      ...visible,
                                    ]),
                                  );
                                  setBulkTransfer({
                                    ...bulkTransfer,
                                    students: merged,
                                  });
                                } else {
                                  // remove visible ids from selection
                                  setBulkTransfer({
                                    ...bulkTransfer,
                                    students: bulkTransfer.students.filter(
                                      (id) => !visible.includes(id),
                                    ),
                                  });
                                }
                              }}
                            />
                            <span className="font-medium">
                              Select all visible students (
                              {
                                getStudentsForCourse(bulkTransfer.fromCourse)
                                  .length
                              }
                              )
                            </span>
                          </label>

                          {getStudentsForCourse(bulkTransfer.fromCourse).map(
                            (student) => (
                              <label
                                key={student.id}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={bulkTransfer.students.includes(
                                    student.id,
                                  )}
                                  onChange={(e) => {
                                    if (e.target.checked)
                                      setBulkTransfer({
                                        ...bulkTransfer,
                                        students: [
                                          ...bulkTransfer.students,
                                          student.id,
                                        ],
                                      });
                                    else
                                      setBulkTransfer({
                                        ...bulkTransfer,
                                        students: bulkTransfer.students.filter(
                                          (id) => id !== student.id,
                                        ),
                                      });
                                  }}
                                  className="rounded"
                                />
                                <span>
                                  {student.fullName ||
                                    student.name ||
                                    student.studentName ||
                                    student.email ||
                                    student.studentEmail ||
                                    "(no name)"}
                                </span>
                              </label>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleBulkTransfer}
                      disabled={
                        !bulkTransfer.fromCourse ||
                        !bulkTransfer.toCourse ||
                        bulkTransfer.students.length === 0 ||
                        isTransferring
                      }
                      className="w-full"
                    >
                      {isTransferring
                        ? "Transferring..."
                        : `Transfer ${bulkTransfer.students.length} Student(s)`}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Confirmation dialog for bulk transfer */}
              <Dialog
                open={isConfirmBulkOpen}
                onOpenChange={setIsConfirmBulkOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm bulk transfer</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p>{confirmMsg}</p>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setIsConfirmBulkOpen(false)}
                        disabled={isTransferring}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={doConfirmTransfer}
                        disabled={isTransferring}
                      >
                        {isTransferring
                          ? "Transferring..."
                          : "Confirm transfer"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {courses.map((course) => {
              const courseStudents = getStudentsForCourse(course.id);
              return (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {course.title} - Students ({courseStudents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {courseStudents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No students enrolled yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {courseStudents.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">
                                {student.fullName || student.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {student.email}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleRemoveStudent(student.id, course.id)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        )}

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Dialog
            open={isCreateModuleOpen}
            onOpenChange={setIsCreateModuleOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Module/Chapter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Module and Chapter</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Course *</Label>
                  <Select
                    value={newModule.courseId}
                    onValueChange={(value) =>
                      setNewModule({ ...newModule, courseId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Module Title</Label>
                  <Input
                    value={newModule.title}
                    onChange={(e) =>
                      setNewModule({ ...newModule, title: e.target.value })
                    }
                    placeholder="e.g., Module 1: Introduction"
                  />
                </div>

                <div>
                  <Label>Chapter Title</Label>
                  <Input
                    value={newModule.chapterTitle}
                    onChange={(e) =>
                      setNewModule({
                        ...newModule,
                        chapterTitle: e.target.value,
                      })
                    }
                    placeholder="e.g., Chapter 1: Getting Started"
                  />
                </div>

                <div>
                  <Label>Chapter Notes</Label>
                  <Textarea
                    value={newModule.notes}
                    onChange={(e) =>
                      setNewModule({ ...newModule, notes: e.target.value })
                    }
                    placeholder="Rich text notes for this chapter"
                    rows={5}
                  />
                </div>

                <div>
                  <Label>Attach Files (optional)</Label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      setNewModule({
                        ...newModule,
                        files: e.target.files ? Array.from(e.target.files) : [],
                      })
                    }
                    className="mt-1"
                  />
                  {newModule.files && newModule.files.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {newModule.files.length} file(s) selected
                    </p>
                  )}
                </div>

                <div>
                  <Label>PPT Link (optional)</Label>
                  <Input
                    value={newModule.pptLink}
                    onChange={(e) =>
                      setNewModule({ ...newModule, pptLink: e.target.value })
                    }
                    placeholder="https://example.com/slide.pptx"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    PPT links are stored at the chapter level. If you want a
                    course-level PPT, use the Course editor.
                  </p>
                </div>

                <Button onClick={handleCreateModule} className="w-full">
                  Create Module & Chapter
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-4">
            {courses.map((course) => {
              const courseModules = getModulesForCourse(course.id);
              return (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {course.title} - Content Modules
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {courseModules.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No modules created yet
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {courseModules.map((module) => (
                          <Card key={module.id} className="p-4">
                            <h4 className="font-semibold mb-3">
                              {module.title}
                            </h4>
                            <div className="space-y-2">
                              {module.chapters.map((chapter: any) => (
                                <div
                                  key={chapter.id}
                                  className="p-3 bg-muted rounded"
                                >
                                  <p className="font-medium text-sm">
                                    {chapter.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {chapter.notes}
                                  </p>
                                  {chapter.files &&
                                    chapter.files.length > 0 && (
                                      <p className="text-xs text-muted-foreground mt-2">
                                        {chapter.files.length} files attached
                                      </p>
                                    )}
                                </div>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Label>Filter by Course</Label>
              <Select
                value={announcementFilterCourse ?? "__all__"}
                onValueChange={(v) => {
                  const courseId = v === "__all__" ? undefined : v;
                  setAnnouncementFilterCourse(courseId);
                  fetchAnnouncements(courseId);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All courses</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Dialog
                open={isCreateAnnouncementOpen}
                onOpenChange={setIsCreateAnnouncementOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Announcement</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Course (leave empty for global)</Label>
                      <Select
                        value={newAnnouncement.courseId || "__global__"}
                        onValueChange={(v) =>
                          setNewAnnouncement({
                            ...newAnnouncement,
                            courseId: v === "__global__" ? "" : v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose course (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__global__">Global</SelectItem>
                          {courses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={newAnnouncement.title}
                        onChange={(e) =>
                          setNewAnnouncement({
                            ...newAnnouncement,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Message</Label>
                      <Textarea
                        value={newAnnouncement.message}
                        onChange={(e) =>
                          setNewAnnouncement({
                            ...newAnnouncement,
                            message: e.target.value,
                          })
                        }
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCreateAnnouncementOpen(false);
                          setNewAnnouncement({
                            title: "",
                            message: "",
                            courseId: "",
                            isGlobal: false,
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            const payload: any = {
                              title: newAnnouncement.title,
                              message: newAnnouncement.message,
                            };
                            if (newAnnouncement.courseId)
                              payload.courseId = newAnnouncement.courseId;
                            else payload.isGlobal = true;
                            const res = await announcementsApi.create(payload);
                            setAnnouncements((prev) => [res, ...prev]);
                            setIsCreateAnnouncementOpen(false);
                            setNewAnnouncement({
                              title: "",
                              message: "",
                              courseId: "",
                              isGlobal: false,
                            });
                            toast({
                              title: "Announcement created",
                              description: "Announcement was posted.",
                            });
                          } catch (err) {
                            toast({
                              title: "Failed",
                              description:
                                err instanceof Error
                                  ? err.message
                                  : String(err),
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No announcements yet
              </p>
            ) : (
              announcements.map((a) => (
                <Card key={a.id || a._id}>
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {a.courseId
                            ? `Course: ${a.courseId.title || a.courseId}`
                            : "Global"}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString()}
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (onNavigate) onNavigate("announcements");
                            else {
                              try {
                                window.location.hash = "announcements";
                              } catch (e) {}
                            }
                          }}
                          title="Open announcements"
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDeleteAnnouncement(a.id || a._id)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Course Dialog */}
      <Dialog open={isEditCourseOpen} onOpenChange={setIsEditCourseOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          {editCourseDraft && (
            <CreateCourse
              initialCourse={editCourseDraft}
              onCancel={() => {
                setIsEditCourseOpen(false);
                setEditCourseDraft(null);
              }}
              onUpdated={(updated: any) => {
                setCourses((prev) =>
                  prev.map((c) =>
                    c.id === (updated.id || updated._id)
                      ? { ...c, ...updated }
                      : c,
                  ),
                );
                setIsEditCourseOpen(false);
                setEditCourseDraft(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog
        open={isEditAssignmentOpen}
        onOpenChange={setIsEditAssignmentOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          {editAssignmentDraft && (
            <CreateAssignment
              initialAssignment={editAssignmentDraft}
              onCancel={() => {
                setIsEditAssignmentOpen(false);
                setEditAssignmentDraft(null);
              }}
              onUpdated={(updated: any) => {
                setAssignments((prev) =>
                  prev.map((a) =>
                    a.id === (updated.id || updated._id)
                      ? { ...a, ...updated }
                      : a,
                  ),
                );
                setIsEditAssignmentOpen(false);
                setEditAssignmentDraft(null);
                toast({
                  title: "Assignment updated",
                  description: "Assignment updated successfully.",
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
