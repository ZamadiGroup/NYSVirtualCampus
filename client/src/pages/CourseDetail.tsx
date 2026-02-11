import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MaterialCard } from "@/components/MaterialCard";
import { AssignmentCard } from "@/components/AssignmentCard";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import {
  BookOpen,
  Users,
  Clock,
  Award,
  Edit,
  Trash2,
  ChevronDown,
  Play,
  FileText,
  CheckCircle2,
  Lock,
  BarChart3,
} from "lucide-react";
import techThumbnail from "@assets/generated_images/Technology_course_thumbnail_5e4c2c8c.png";
import { useEffect, useState } from "react";
import {
  coursesApi,
  assignmentsApi,
  announcementsApi,
  ApiCourse,
} from "@/lib/api";
import CreateAssignment, { type AssignmentDraft } from "./CreateAssignment";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

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

type CourseDetailProps = {
  courseId?: string;
};

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterDesc, setNewChapterDesc] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [editCourseMode, setEditCourseMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [savingCourse, setSavingCourse] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [editAssignmentDraft, setEditAssignmentDraft] =
    useState<AssignmentDraft | null>(null);
  const [expandedModules, setExpandedModules] = useState<
    Record<number, boolean>
  >({});
  const [completedLessons, setCompletedLessons] = useState<
    Record<string, boolean>
  >({});
  const { toast: toastHook } = useToast();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const currentUser = parseJwt(token) as any;
  // compute canEdit after course is loaded: admin can edit any course; tutor can edit only if assigned as instructor
  const canEdit = (() => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    if (currentUser.role === "tutor" && course) {
      const instr: any = (course as any).instructorId;
      const instrId = instr ? String(instr.id || instr._id || instr) : "";
      const curId = String(
        currentUser.userId || currentUser.user_id || currentUser.id,
      );
      return instrId === curId;
    }
    return false;
  })();

  const instructorDisplay = (() => {
    const instr: any = (course as any)?.instructorId;
    if (!instr) return "TBD";
    if (typeof instr === "string") return instr;
    return instr.fullName || instr.name || String(instr._id || "TBD");
  })();

  // Helper functions for module view
  const toggleModule = (index: number) => {
    setExpandedModules((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleLessonComplete = (lessonId: string) => {
    setCompletedLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  const getModuleStatus = (moduleIndex: number, totalLessons: number) => {
    const chapter = course?.chapters?.[moduleIndex];
    if (!chapter) return "locked";

    const lessonIds =
      chapter.materials?.map((_, idx) => `${moduleIndex}-${idx}`) || [];
    const completed = lessonIds.filter((id) => completedLessons[id]).length;

    if (completed === 0) return moduleIndex === 0 ? "in_progress" : "locked";
    if (completed === totalLessons) return "completed";
    return "in_progress";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "from-emerald-50 to-emerald-50 border-emerald-200";
      case "in_progress":
        return "from-green-50 to-green-50 border-green-200";
      case "locked":
        return "from-slate-50 to-slate-50 border-slate-200";
      default:
        return "from-slate-50 to-slate-50 border-slate-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 size={14} /> Completed
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
            <BarChart3 size={14} /> In Progress
          </span>
        );
      case "locked":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            <Lock size={14} /> Locked
          </span>
        );
      default:
        return null;
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play size={16} className="text-purple-600" />;
      case "quiz":
        return <BookOpen size={16} className="text-orange-600" />;
      case "reading":
        return <FileText size={16} className="text-green-600" />;
      case "ppt":
        return <FileText size={16} className="text-green-600" />;
      case "file":
        return <FileText size={16} className="text-green-600" />;
      case "assignment":
        return <BarChart3 size={16} className="text-green-600" />;
      default:
        return <FileText size={16} className="text-green-600" />;
    }
  };

  const getLessonTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      video: "Video",
      quiz: "Quiz",
      reading: "Reading",
      assignment: "Assignment",
      ppt: "Presentation",
      file: "Document",
    };
    return labels[type] || "Material";
  };

  const calculateProgress = () => {
    if (!course?.chapters) return 0;
    const totalLessons = course.chapters.reduce(
      (sum, ch) => sum + (ch.materials?.length || 0),
      0,
    );
    if (totalLessons === 0) return 0;
    const completed = Object.values(completedLessons).filter(Boolean).length;
    return Math.round((completed / totalLessons) * 100);
  };

  const progress = calculateProgress();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (courseId) {
          const c = await coursesApi.getById(courseId);
          if (!mounted) return;
          setCourse(c as ApiCourse);
          // load assignments for this course
          try {
            const ares = await assignmentsApi.getAll(
              String((c as any)._id || (c as any).id),
            );
            if (mounted) setAssignments(Array.isArray(ares) ? ares : []);
          } catch (e) {
            console.error("Failed to load assignments for course", e);
          }

          // load announcements for this course
          try {
            const ann = await announcementsApi.getAll(
              String((c as any)._id || (c as any).id),
            );
            if (mounted) setAnnouncements(Array.isArray(ann) ? ann : []);
          } catch (e) {
            console.error("Failed to load announcements for course", e);
          }
        } else {
          const all = await coursesApi.getAll();
          if (!mounted) return;
          if (Array.isArray(all) && all.length > 0) {
            setCourse(all[0] as ApiCourse);
          }
        }
      } catch (e) {
        console.error("Failed to load course for details", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const addChapter = async () => {
    if (!course) return;
    const chapters = [
      ...(course.chapters || []),
      { title: newChapterTitle, description: newChapterDesc, materials: [] },
    ];
    try {
      const updated = await coursesApi.update(course.id, { chapters });
      setCourse(updated as ApiCourse);
      setNewChapterTitle("");
      setNewChapterDesc("");
    } catch (e) {
      console.error("Failed to add chapter", e);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="relative h-48 rounded-lg overflow-hidden">
        <img
          src={techThumbnail}
          alt="Course banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <Badge className="mb-2 bg-primary">
                {course?.department || "General"}
              </Badge>
              {!editCourseMode ? (
                <>
                  <h1
                    className="text-3xl font-bold"
                    data-testid="text-course-title"
                  >
                    {course?.title || "Course"}
                  </h1>
                  <p className="text-sm mt-1 opacity-90">
                    Taught by {instructorDisplay}
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Course title"
                  />
                  <Input
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    placeholder="Department"
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    placeholder="Short description"
                  />
                </div>
              )}
            </div>
            <div className="ml-4">
              {canEdit && !editCourseMode && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditCourseMode(true);
                    setEditTitle(course?.title || "");
                    setEditDescription(course?.description || "");
                    setEditDepartment(course?.department || "");
                  }}
                >
                  Edit Course
                </Button>
              )}
              {canEdit && editCourseMode && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditCourseMode(false);
                    }}
                    disabled={savingCourse}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!course) return;
                      setSavingCourse(true);
                      try {
                        const updated = await coursesApi.update(course.id, {
                          title: editTitle,
                          description: editDescription,
                          department: editDepartment,
                        });
                        setCourse(updated as ApiCourse);
                        toastHook({
                          title: "Course updated",
                          description: "Course details saved.",
                        });
                        setEditCourseMode(false);
                      } catch (err: any) {
                        console.error("Failed to save course", err);
                        toastHook({
                          title: "Save failed",
                          description:
                            (err && err.message) || "Unable to save course",
                          variant: "destructive",
                        });
                      } finally {
                        setSavingCourse(false);
                      }
                    }}
                    disabled={savingCourse}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">145</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-chart-3/10 text-chart-3">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">65%</p>
                <p className="text-sm text-muted-foreground">Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-chart-2/10 text-chart-2">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Materials</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-sm text-muted-foreground">Avg. Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Completion</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>
      {course && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Course Notes</CardTitle>
            {canEdit && !editMode && (
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditNotes(course.notes || "");
                    setEditMode(true);
                  }}
                >
                  Edit
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!editMode ? (
              <div className="prose max-w-none">
                <p>
                  {course.notes || (
                    <span className="text-muted-foreground">
                      No notes for this course.
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={6}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setEditNotes("");
                    }}
                    disabled={savingNotes}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        setSavingNotes(true);
                        const updated = await coursesApi.update(course.id, {
                          notes: editNotes,
                        });
                        setCourse(updated as ApiCourse);
                        toastHook({
                          title: "Notes saved",
                          description: "Course notes updated successfully.",
                        });
                        setEditMode(false);
                      } catch (err: any) {
                        console.error("Failed to save notes", err);
                        toastHook({
                          title: "Save failed",
                          description:
                            (err && err.message) || "Unable to save notes",
                          variant: "destructive",
                        });
                      } finally {
                        setSavingNotes(false);
                      }
                    }}
                    disabled={savingNotes}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs
        defaultValue={currentUser?.role === "student" ? "modules" : "materials"}
        className="w-full"
      >
        <TabsList>
          {currentUser?.role === "student" && (
            <TabsTrigger value="modules" data-testid="tab-modules">
              Course Modules
            </TabsTrigger>
          )}
          <TabsTrigger value="materials" data-testid="tab-materials">
            Materials
          </TabsTrigger>
          <TabsTrigger value="chapters" data-testid="tab-chapters">
            Chapters
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            Assignments
          </TabsTrigger>
          <TabsTrigger value="announcements" data-testid="tab-announcements">
            Announcements
          </TabsTrigger>
        </TabsList>

        {/* Student Module View */}
        {currentUser?.role === "student" && (
          <TabsContent value="modules" className="space-y-4">
            <div className="space-y-4">
              {/* Course Overview Section */}
              <Card className="border-none shadow-sm">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Course Description
                      </p>
                      <p className="text-base text-slate-700 leading-relaxed">
                        {course?.description ||
                          course?.notes ||
                          "No description available."}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-slate-700">
                          Overall Progress
                        </span>
                        <span className="text-sm font-semibold text-slate-600">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Instructor Info */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {(() => {
                              const initials = instructorDisplay
                                .split(" ")
                                .map((word: string) => word[0] || "")
                                .join("")
                                .slice(0, 2)
                                .toUpperCase();
                              return initials || "IN";
                            })()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {instructorDisplay}
                          </p>
                          <p className="text-sm text-slate-600">
                            Course Instructor
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Modules Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Course Modules
                </h2>

                {course?.chapters && course.chapters.length > 0 ? (
                  course.chapters.map((chapter, index) => {
                    const lessonCount = chapter.materials?.length || 0;
                    const moduleStatus = getModuleStatus(index, lessonCount);
                    const isExpanded = expandedModules[index];
                    const isLocked = moduleStatus === "locked" && index !== 0;

                    return (
                      <Card
                        key={index}
                        className={`transition-all duration-300 ${getStatusColor(moduleStatus)} shadow-sm hover:shadow-md`}
                      >
                        {/* Module Header */}
                        <button
                          onClick={() => !isLocked && toggleModule(index)}
                          disabled={isLocked}
                          className={`w-full px-6 py-5 flex items-center justify-between transition-colors ${
                            isLocked
                              ? "cursor-not-allowed opacity-75"
                              : "hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1 text-left">
                            {/* Module Number */}
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                                moduleStatus === "completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : moduleStatus === "in_progress"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {index + 1}
                            </div>

                            <div className="flex-1">
                              <h3 className="font-bold text-slate-900 text-lg">
                                {chapter.title || `Module ${index + 1}`}
                              </h3>
                              <p className="text-sm text-slate-600 mt-1">
                                {chapter.description || "No description"}
                              </p>
                              <div className="flex items-center gap-4 mt-3">
                                <span className="text-xs text-slate-500 font-medium">
                                  {lessonCount} lessons
                                </span>
                                {getStatusBadge(moduleStatus)}
                              </div>
                            </div>
                          </div>

                          {!isLocked && (
                            <ChevronDown
                              size={24}
                              className={`text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                            />
                          )}

                          {isLocked && (
                            <Lock size={20} className="text-slate-400" />
                          )}
                        </button>

                        {/* Lessons List */}
                        {isExpanded &&
                          chapter.materials &&
                          chapter.materials.length > 0 && (
                            <div className="border-t border-slate-100 bg-gradient-to-b from-transparent to-slate-50/50">
                              <div className="p-6 space-y-3">
                                {chapter.materials.map((material, mIdx) => {
                                  const lessonId = `${index}-${mIdx}`;
                                  const isCompleted =
                                    completedLessons[lessonId];
                                  const materialType = material.type || "file";

                                  return (
                                    <div
                                      key={mIdx}
                                      className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                                        isCompleted
                                          ? "bg-emerald-50"
                                          : "bg-white border border-slate-100 hover:bg-slate-50"
                                      }`}
                                    >
                                      {/* Checkbox/Indicator */}
                                      <div
                                        className="flex-shrink-0 cursor-pointer"
                                        onClick={() =>
                                          toggleLessonComplete(lessonId)
                                        }
                                      >
                                        {isCompleted ? (
                                          <CheckCircle2
                                            size={22}
                                            className="text-emerald-600"
                                          />
                                        ) : (
                                          <div className="w-5.5 h-5.5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                                        )}
                                      </div>

                                      {/* Lesson Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                          {getLessonIcon(materialType)}
                                          <h4
                                            className={`font-semibold text-sm ${isCompleted ? "text-slate-600 line-through" : "text-slate-900"}`}
                                          >
                                            {material.label ||
                                              material.url?.split("/").pop() ||
                                              `Lesson ${mIdx + 1}`}
                                          </h4>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                          <span
                                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                              materialType === "video"
                                                ? "bg-purple-100 text-purple-700"
                                                : materialType === "quiz"
                                                  ? "bg-orange-100 text-orange-700"
                                                  : materialType === "ppt"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-green-100 text-green-700"
                                            }`}
                                          >
                                            {getLessonTypeLabel(materialType)}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Action Button */}
                                      <Button
                                        size="sm"
                                        className={`flex-shrink-0 ${
                                          isCompleted
                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                        }`}
                                        onClick={() =>
                                          material.url &&
                                          window.open(material.url, "_blank")
                                        }
                                      >
                                        {isCompleted ? "Review" : "Start"}
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                      </Card>
                    );
                  })
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">
                        No modules available yet.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Footer Info */}
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-slate-200">
                  <p className="text-sm text-slate-700">
                    💡 <span className="font-semibold">Pro tip:</span> Complete
                    all lessons in a module before moving to the next one.
                    Locked modules will unlock once you finish the previous
                    module.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="materials" className="space-y-3">
          <MaterialCard
            id="1"
            title="Introduction to Databases - Lecture Notes.pdf"
            type="pdf"
            size="2.4 MB"
            uploadedAt={today}
            onDownload={() => console.log("Download material")}
            onView={() => console.log("View material")}
          />
          <MaterialCard
            id="2"
            title="Database Normalization Tutorial Video"
            type="video"
            size="45 MB"
            uploadedAt={today}
            onDownload={() => console.log("Download material")}
            onView={() => console.log("View material")}
          />
          <MaterialCard
            id="3"
            title="SQL Practice Exercises - External Resource"
            type="link"
            uploadedAt={today}
            onView={() => console.log("Open link")}
          />
        </TabsContent>

        <TabsContent value="chapters" className="space-y-4">
          <div className="max-w-3xl space-y-4">
            {course && course.chapters && course.chapters.length > 0 ? (
              course.chapters.map((c, idx) => (
                <div key={idx} className="p-4 border rounded-md">
                  <h3 className="font-semibold">
                    Chapter {idx + 1}: {c.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {c.description}
                  </p>
                  {c.materials && c.materials.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {c.materials.map((m, mIdx) => {
                        const titleStr = (m.label ||
                          m.url ||
                          `Material ${mIdx + 1}`) as string;
                        return (
                          <MaterialCard
                            key={`${idx}-${mIdx}`}
                            id={`${idx}-${mIdx}`}
                            title={titleStr}
                            type={(m.type as any) || "pdf"}
                            uploadedAt={new Date()}
                            onDownload={() => {
                              if (m.url) window.open(m.url, "_blank");
                            }}
                            onView={() => {
                              if (m.url) window.open(m.url, "_blank");
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No chapters yet.</p>
            )}

            {canEdit ? (
              <div className="pt-4 border-t">
                <h4 className="font-semibold">Add Chapter</h4>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <Input
                    placeholder="Chapter title"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Chapter content / notes"
                    value={newChapterDesc}
                    onChange={(e) => setNewChapterDesc(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button onClick={addChapter}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Chapter
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="space-y-4">
            {canEdit && (
              <div className="flex justify-end">
                <Dialog
                  open={isCreateAssignmentOpen}
                  onOpenChange={setIsCreateAssignmentOpen}
                >
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsCreateAssignmentOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Assignment</DialogTitle>
                    </DialogHeader>
                    <CreateAssignment
                      onCancel={() => setIsCreateAssignmentOpen(false)}
                      onCreated={async (a) => {
                        // refresh assignments list
                        try {
                          const list = await assignmentsApi.getAll(
                            String(course?.id || (course as any)?._id),
                          );
                          setAssignments(Array.isArray(list) ? list : []);
                        } catch (e) {
                          console.error(e);
                        }
                        setIsCreateAssignmentOpen(false);
                        toastHook({
                          title: "Assignment created",
                          description: "Assignment was added.",
                        });
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No assignments yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map((a) => (
                  <div key={a.id || a._id} className="relative">
                    <AssignmentCard
                      id={a.id || a._id}
                      title={a.title}
                      courseName={course?.title || ""}
                      dueDate={a.dueDate ? new Date(a.dueDate) : new Date()}
                      status={a.status || "pending"}
                      grade={a.grade}
                      onView={() => console.log("View submission")}
                    />
                    {canEdit && (
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditAssignmentDraft(a);
                            setIsEditAssignmentOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            if (!confirm("Delete this assignment?")) return;
                            try {
                              await assignmentsApi.delete(a.id || a._id);
                              setAssignments((prev) =>
                                prev.filter(
                                  (x) => (x.id || x._id) !== (a.id || a._id),
                                ),
                              );
                              toastHook({
                                title: "Deleted",
                                description: "Assignment deleted.",
                              });
                            } catch (err: any) {
                              console.error("Failed to delete assignment", err);
                              toastHook({
                                title: "Delete failed",
                                description: err?.message || "Unable to delete",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Edit dialog (re-uses CreateAssignment for updating) */}
            <Dialog
              open={isEditAssignmentOpen}
              onOpenChange={setIsEditAssignmentOpen}
            >
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editAssignmentDraft
                      ? "Edit Assignment"
                      : "Create Assignment"}
                  </DialogTitle>
                </DialogHeader>
                {editAssignmentDraft ? (
                  <CreateAssignment
                    initialAssignment={editAssignmentDraft as AssignmentDraft}
                    onCancel={() => {
                      setIsEditAssignmentOpen(false);
                      setEditAssignmentDraft(null);
                    }}
                    onUpdated={async (updated) => {
                      // refresh assignments list
                      try {
                        const list = await assignmentsApi.getAll(
                          String(course?.id || (course as any)?._id),
                        );
                        setAssignments(Array.isArray(list) ? list : []);
                      } catch (e) {
                        console.error(e);
                      }
                      setIsEditAssignmentOpen(false);
                      setEditAssignmentDraft(null);
                      toastHook({
                        title: "Assignment updated",
                        description: "Saved changes.",
                      });
                    }}
                  />
                ) : (
                  <div />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <div className="max-w-3xl space-y-4">
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No announcements yet
              </p>
            ) : (
              announcements.map((a: any) => (
                <AnnouncementCard
                  key={a._id || a.id}
                  id={String(a._id || a.id)}
                  title={a.title}
                  content={a.message}
                  courseName={a.courseId?.title || course?.title}
                  postedBy={a.authorId?.fullName || "Staff"}
                  postedAt={a.createdAt ? new Date(a.createdAt) : today}
                  priority={a.isGlobal ? "important" : "normal"}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
