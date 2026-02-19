import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import Header from "@/components/Header";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { PlanNotificationProvider } from "@/components/PlanNotification";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Homepage from "@/pages/Homepage";
import LandingPage from "@/pages/LandingPage";
import Auth from "@/pages/Auth";
import StudentDashboard from "@/pages/StudentDashboard";
import TutorDashboard from "@/pages/TutorDashboard";
import TutorAssignments from "@/components/TutorAssignments";
import { AssignmentCard } from "@/components/AssignmentCard";
import AdminDashboard from "@/pages/AdminDashboard";
import Users from "@/pages/Users";
import Analytics from "@/pages/Analytics";
import CourseDetail from "@/pages/CourseDetail";
import CourseList from "@/pages/CourseList";
import CreateCourse from "@/pages/CreateCourse";
import CreateAssignment, {
  type AssignmentDraft,
} from "@/pages/CreateAssignment";
import AssignmentDetail, { type Assignment } from "@/pages/AssignmentDetail";
import StudentGrades, { type GradeRecord } from "@/pages/StudentGrades";
import AdminUploads from "@/pages/AdminUploads";
import ManageAssignments from "@/pages/ManageAssignments";
import TutorGrades from "@/pages/TutorGrades";
import Announcements, { type Announcement } from "@/pages/Announcements";
import SubmissionsPage from "@/pages/Submissions";
import SystemSettings from "@/pages/SystemSettings";
import { useAuth } from "@/lib/useAuth";
import { assignmentsApi, announcementsApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import LoginDialog from "@/components/LoginDialog";
// TutorAssignments was temporarily added; navigation will render the full TutorDashboard instead.

function App() {
  // removed demo role-switcher: derive view from authenticated user or default to 'student'
  const [currentPage, setCurrentPage] = useState<
    | "landing"
    | "homepage"
    | "auth"
    | "dashboard"
    | "courses"
    | "course-detail"
    | "assignments"
    | "announcements"
    | "students"
    | "submissions"
    | "analytics"
    | "users"
    | "settings"
    | "create-course"
    | "create-assignment"
    | "assignment-detail"
    | "student-grades"
    | "admin-uploads"
    | "manage-assignments"
    | "tutor-grades"
  >("landing");

  // In-memory demo state for assignments, submissions, grades, and admin visibility
  type AssignmentWithDue = Assignment & { dueDate?: string };
  const [assignments, setAssignments] = useState<AssignmentWithDue[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<
    string | null
  >(null);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [tutorGrades, setTutorGrades] = useState<
    (GradeRecord & { studentName: string })[]
  >([]);
  const [adminItems, setAdminItems] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const userNames = {
    student: "James Omondi",
    tutor: "Dr. Sarah Kamau",
    admin: "System Administrator",
  };

  const { user, isAuthenticated, logout, refresh } = useAuth();
  // Normalize role: server may return 'lecturer' or 'tutor' for teaching staff.
  const normalizeRole = (r: string | undefined | null) => {
    if (!r) return "student";
    if (r === "admin") return "admin";
    if (r === "tutor" || r === "lecturer") return "tutor";
    return "student";
  };

  const view = normalizeRole(user?.role as string | undefined);

  const displayName = user?.fullName ?? userNames[view];

  const handleSidebarNavigation = (page: string) => {
    // Navigate to the requested page. Do not auto-open a single assignment for tutors —
    // clicking "Assignments" should always show the assignments list/dashboard so tutors
    // can access all assignment management features.
    setCurrentPage(page as any);
  };

  // Fetch authoritative assignments list from server on mount
  const fetchAssignments = async () => {
    try {
      const serverAssignments = await assignmentsApi.getAll();
      // serverAssignments may include populated course title; ensure shape matches AssignmentWithDue
      setAssignments(Array.isArray(serverAssignments) ? serverAssignments : []);
    } catch (err) {
      // keep existing local assignments on failure
      console.error("Failed to fetch assignments", err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await announcementsApi.getAll();
      const normalized: Announcement[] = Array.isArray(res)
        ? res.map((a: any) => ({
            id: String(a._id || a.id),
            message: a.message,
            authorRole: "tutor",
            authorName: a.authorId?.fullName || "Staff",
            createdAt: a.createdAt,
          }))
        : [];
      setAnnouncements(normalized);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    }
  };

  React.useEffect(() => {
    fetchAssignments();
    fetchAnnouncements();
  }, []);

  // Browser history integration - sync URL with app state
  useEffect(() => {
    const parseUrl = () => {
      try {
        const hash = window.location.hash.replace(/^#/, "");
        if (!hash) {
          // Default to landing page if not authenticated, homepage if authenticated
          setCurrentPage(isAuthenticated ? "homepage" : "landing");
          return;
        }

        const [page, ...params] = hash.split("/");

        // Protected pages require authentication
        const protectedPages = [
          "homepage",
          "dashboard",
          "courses",
          "course-detail",
          "assignments",
          "assignment-detail",
          "announcements",
          "students",
          "submissions",
          "analytics",
          "users",
          "settings",
          "create-course",
          "create-assignment",
          "student-grades",
          "admin-uploads",
          "manage-assignments",
          "tutor-grades",
        ];

        if (protectedPages.includes(page) && !isAuthenticated) {
          console.log("User not authenticated, redirecting to landing");
          setCurrentPage("landing");
          window.history.replaceState(null, "", "#landing");
          return;
        }

        setCurrentPage(page as any);

        // Parse query params for IDs
        if (params.length > 0) {
          const query = params.join("/");
          if (query.includes("course=")) {
            const courseId = query.match(/course=([^&]+)/)?.[1];
            if (courseId) setSelectedCourseId(courseId);
          }
          if (query.includes("assignment=")) {
            const assignmentId = query.match(/assignment=([^&]+)/)?.[1];
            if (assignmentId) setSelectedAssignmentId(assignmentId);
          }
        }
      } catch (e) {
        console.error("Error parsing URL:", e);
      }
    };

    // Parse URL on mount
    parseUrl();

    // Listen to browser back/forward
    window.addEventListener("popstate", parseUrl);
    return () => window.removeEventListener("popstate", parseUrl);
  }, [isAuthenticated]);

  // Update URL when page changes
  useEffect(() => {
    let hash = `#${currentPage}`;

    // Add IDs to URL
    const params: string[] = [];
    if (
      selectedCourseId &&
      (currentPage === "course-detail" || currentPage === "assignment-detail")
    ) {
      params.push(`course=${selectedCourseId}`);
    }
    if (selectedAssignmentId && currentPage === "assignment-detail") {
      params.push(`assignment=${selectedAssignmentId}`);
    }

    if (params.length > 0) {
      hash += `/${params.join("&")}`;
    }

    // Update URL without triggering hashchange
    if (window.location.hash !== hash) {
      window.history.pushState(null, "", hash);
    }
  }, [currentPage, selectedCourseId, selectedAssignmentId]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PlanNotificationProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              {/* Hide sidebar on the auth and landing pages for a full-page experience */}
              {currentPage !== "auth" && currentPage !== "landing" && (
                <AppSidebar
                  userRole={view}
                  userName={displayName}
                  onNavigate={handleSidebarNavigation}
                  currentPage={currentPage}
                />
              )}
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Hide navigation for landing and auth pages */}
                {currentPage !== "auth" && currentPage !== "landing" && (
                  <Header />
                )}

                <div className="flex-1 overflow-auto bg-background">
                  <div
                    className={
                      currentPage === "landing"
                        ? "w-full"
                        : "container mx-auto p-6 max-w-7xl"
                    }
                  >
                    {currentPage === "landing" && (
                      <LandingPage onNavigate={handleSidebarNavigation} />
                    )}

                    {currentPage === "homepage" && (
                      <Homepage
                        userRole={view}
                        userName={displayName}
                        onNavigate={handleSidebarNavigation}
                      />
                    )}

                    {/* Full-page auth: remove header/sidebar and navigate to correct portal on login */}
                    {currentPage === "auth" && (
                      <Auth
                        onLogin={() => {
                          // Refresh hook state and immediately read current user to decide routing
                          try {
                            refresh();
                          } catch (e) {}
                          const newUser = getCurrentUser();
                          const mapped = normalizeRole(newUser?.role);
                          // Ensure dashboard shows the right portal
                          setCurrentPage("dashboard");
                          // reset hash if present
                          try {
                            window.location.hash = "";
                          } catch (e) {}
                          // Optionally you could set other state here based on role
                        }}
                      />
                    )}

                    {currentPage === "dashboard" && (
                      <>
                        {view === "student" && (
                          <StudentDashboard
                            onOpenCourse={(id: string) => {
                              setSelectedCourseId(id);
                              setCurrentPage("course-detail");
                            }}
                            onOpenAssignment={(id: string) => {
                              setSelectedAssignmentId(id);
                              setCurrentPage("assignment-detail");
                            }}
                          />
                        )}
                        {view === "tutor" && (
                          <TutorDashboard
                            onNavigate={handleSidebarNavigation}
                            onOpenCourse={(id: string) => {
                              setSelectedCourseId(id);
                              setCurrentPage("course-detail");
                            }}
                            onOpenAssignment={(id: string) => {
                              setSelectedAssignmentId(id);
                              setCurrentPage("assignment-detail");
                            }}
                            onAddAssignment={(a: any) =>
                              setAssignments((prev) => [a, ...prev])
                            }
                            onUpdateAssignment={(a: any) =>
                              setAssignments((prev) =>
                                prev.map((x) =>
                                  x.id === (a.id || a._id) ? { ...x, ...a } : x,
                                ),
                              )
                            }
                            onDeleteAssignment={(id: string) =>
                              setAssignments((prev) =>
                                prev.filter((x) => x.id !== id),
                              )
                            }
                            assignmentsFromApp={assignments}
                            onAssignmentsChange={(a: any[]) =>
                              setAssignments(a)
                            }
                          />
                        )}
                        {view === "admin" && <AdminDashboard />}
                      </>
                    )}

                    {currentPage === "courses" &&
                      (view === "tutor" ? (
                        <TutorDashboard
                          initialTab="courses"
                          showHeader={false}
                          hideAssignments={true}
                          hideStudents={true}
                          onNavigate={handleSidebarNavigation}
                          onOpenCourse={(id: string) => {
                            setSelectedCourseId(id);
                            setCurrentPage("course-detail");
                          }}
                          onOpenAssignment={(id: string) => {
                            setSelectedAssignmentId(id);
                            setCurrentPage("assignment-detail");
                          }}
                          onAddAssignment={(a: any) =>
                            setAssignments((prev) => [a, ...prev])
                          }
                          onUpdateAssignment={(a: any) =>
                            setAssignments((prev) =>
                              prev.map((x) =>
                                x.id === (a.id || a._id) ? { ...x, ...a } : x,
                              ),
                            )
                          }
                          onDeleteAssignment={(id: string) =>
                            setAssignments((prev) =>
                              prev.filter(
                                (x) =>
                                  (x as any).id !== id && (x as any)._id !== id,
                              ),
                            )
                          }
                          assignmentsFromApp={assignments}
                          onAssignmentsChange={(a: any[]) => setAssignments(a)}
                        />
                      ) : (
                        <CourseList
                          userRole={view}
                          onOpenCourse={(id: string) => {
                            setSelectedCourseId(id);
                            setCurrentPage("course-detail");
                          }}
                        />
                      ))}
                    {currentPage === "course-detail" && (
                      <CourseDetail
                        courseId={selectedCourseId || undefined}
                        onOpenAssignment={(id: string) => {
                          setSelectedAssignmentId(id);
                          setCurrentPage("assignment-detail");
                        }}
                      />
                    )}
                    {(view === "tutor" || view === "admin") &&
                      currentPage === "create-course" && (
                        <CreateCourse
                          onCancel={() => setCurrentPage("dashboard")}
                          onCreated={() => {
                            setAdminItems((prev) => [
                              {
                                id: `adm-course-${Date.now()}`,
                                type: "course",
                                ownerRole: "tutor",
                                ownerName: "Dr. Sarah Kamau",
                                description: `Course created`,
                                createdAt: new Date().toISOString(),
                              },
                              ...prev,
                            ]);
                            setCurrentPage("dashboard");
                          }}
                        />
                      )}
                    {view === "tutor" &&
                      currentPage === "create-assignment" && (
                        <CreateAssignment
                          onCancel={() => setCurrentPage("dashboard")}
                          onCreated={async (draft: AssignmentDraft) => {
                            // after creating an assignment, refresh authoritative list from server
                            try {
                              await fetchAssignments();
                            } catch (e) {
                              // fallback: append a lightweight local representation
                              const newAssignment: AssignmentWithDue = {
                                id: `${Date.now()}`,
                                courseId: draft.courseId,
                                title: draft.title,
                                type: draft.type,
                                instructions: draft.instructions,
                                questions: draft.questions.map((q) => ({
                                  text: q.text,
                                  imageUrl: q.imageUrl,
                                  choices: q.choices,
                                })),
                                dueDate: draft.dueDate,
                              };
                              setAssignments((prev) => [
                                newAssignment,
                                ...prev,
                              ]);
                            }
                            setAdminItems((prev) => [
                              {
                                id: `adm-${Date.now()}`,
                                type: "assignment",
                                ownerRole: "tutor",
                                ownerName: "Dr. Sarah Kamau",
                                description: `Assignment created: ${draft.title}`,
                                createdAt: new Date().toISOString(),
                              },
                              ...prev,
                            ]);
                            setCurrentPage("dashboard");
                          }}
                        />
                      )}
                    {view === "tutor" &&
                      currentPage === "manage-assignments" && (
                        <ManageAssignments
                          assignments={assignments.map((a) => ({
                            id: a.id,
                            courseId: a.courseId,
                            title: a.title,
                            dueDate: a.dueDate,
                          }))}
                          onExtendDueDate={(id, newDue) => {
                            setAssignments((prev) =>
                              prev.map((a) =>
                                a.id === id ? { ...a, dueDate: newDue } : a,
                              ),
                            );
                            const a = assignments.find((x) => x.id === id);
                            setAdminItems((prev) => [
                              {
                                id: `adm-deadline-${Date.now()}`,
                                type: "assignment",
                                ownerRole: "tutor",
                                ownerName: "Dr. Sarah Kamau",
                                description: `Deadline extended: ${a?.title}`,
                                createdAt: new Date().toISOString(),
                              },
                              ...prev,
                            ]);
                          }}
                        />
                      )}
                    {(view === "tutor" || view === "admin") &&
                      currentPage === "submissions" && <SubmissionsPage />}
                    {view === "tutor" && currentPage === "tutor-grades" && (
                      <TutorGrades
                        grades={tutorGrades}
                        onUpdateManual={(assignmentId, studentName, score) => {
                          setTutorGrades((prev) =>
                            prev.map((g) =>
                              g.assignmentId === assignmentId &&
                              g.studentName === studentName
                                ? { ...g, manualScore: score, status: "graded" }
                                : g,
                            ),
                          );
                          const a = assignments.find(
                            (x) => x.id === assignmentId,
                          );
                          setAdminItems((prev) => [
                            {
                              id: `adm-grade-${Date.now()}`,
                              type: "grade",
                              ownerRole: "tutor",
                              ownerName: "Dr. Sarah Kamau",
                              description: `Manual grade updated: ${a?.title} for ${studentName}`,
                              createdAt: new Date().toISOString(),
                            },
                            ...prev,
                          ]);
                        }}
                      />
                    )}
                    {currentPage === "announcements" && (
                      <Announcements
                        items={announcements}
                        canPost={view !== "student"}
                        authorRole={
                          view === "admin"
                            ? "admin"
                            : view === "tutor"
                              ? "tutor"
                              : undefined
                        }
                        authorName={displayName}
                        onPost={(a) => {
                          setAnnouncements((prev) => [a, ...prev]);
                          setAdminItems((prev) => [
                            {
                              id: `adm-ann-${Date.now()}`,
                              type: "announcement",
                              ownerRole: a.authorRole,
                              ownerName: a.authorName,
                              description: `Announcement posted`,
                              createdAt: a.createdAt,
                            },
                            ...prev,
                          ]);
                        }}
                      />
                    )}
                    {view === "student" &&
                      currentPage === "assignment-detail" &&
                      selectedAssignmentId &&
                      (() => {
                        const a = assignments.find(
                          (x) => x.id === selectedAssignmentId,
                        );
                        if (!a) {
                          return (
                            <Card>
                              <CardHeader>
                                <CardTitle>Assignment Not Found</CardTitle>
                              </CardHeader>
                              <CardContent>
                                The selected assignment could not be found.
                              </CardContent>
                            </Card>
                          );
                        }
                        if (
                          a.dueDate &&
                          new Date(a.dueDate).getTime() < Date.now()
                        ) {
                          return (
                            <Card>
                              <CardHeader>
                                <CardTitle>Assignment Closed</CardTitle>
                              </CardHeader>
                              <CardContent>
                                This assignment is no longer available because
                                the deadline has passed.
                              </CardContent>
                            </Card>
                          );
                        }
                        return (
                          <AssignmentDetail
                            assignment={a}
                            onSubmit={(submission) => {
                              // Auto grade if type is auto (simple string match)
                              const a = assignments.find(
                                (x) => x.id === selectedAssignmentId,
                              )!;
                              // Record submission for admin
                              setAdminItems((prev) => [
                                {
                                  id: `adm-sub-${Date.now()}`,
                                  type: "submission",
                                  ownerRole: "student",
                                  ownerName: "James Omondi",
                                  description: `Submission for: ${a.title}`,
                                  createdAt: new Date().toISOString(),
                                },
                                ...prev,
                              ]);
                              if (a.type === "auto") {
                                // For demo, treat first question's correctAnswer as the answer in questions.choices[0]
                                // Real correct answers are stored in draft only; here we just mark 1 if non-empty
                                const score = Object.values(
                                  submission.answers || {},
                                ).filter((v) => (v as string).trim()).length;
                                const maxScore = a.questions.length;
                                setGrades((prev) => [
                                  {
                                    assignmentId: a.id,
                                    assignmentTitle: a.title,
                                    courseId: a.courseId,
                                    score,
                                    maxScore,
                                    status: "graded",
                                  },
                                  ...prev,
                                ]);
                                setTutorGrades((prev) => [
                                  {
                                    assignmentId: a.id,
                                    assignmentTitle: a.title,
                                    courseId: a.courseId,
                                    score,
                                    maxScore,
                                    status: "graded",
                                    studentName: "James Omondi",
                                  },
                                  ...prev,
                                ]);
                                setAdminItems((prev) => [
                                  {
                                    id: `adm-grade-auto-${Date.now()}`,
                                    type: "grade",
                                    ownerRole: "tutor",
                                    ownerName: "System",
                                    description: `Auto grade computed: ${a.title} for James Omondi`,
                                    createdAt: new Date().toISOString(),
                                  },
                                  ...prev,
                                ]);
                              } else {
                                setGrades((prev) => [
                                  {
                                    assignmentId: a.id,
                                    assignmentTitle: a.title,
                                    courseId: a.courseId,
                                    maxScore: 100,
                                    status: "pending",
                                  },
                                  ...prev,
                                ]);
                                setTutorGrades((prev) => [
                                  {
                                    assignmentId: a.id,
                                    assignmentTitle: a.title,
                                    courseId: a.courseId,
                                    maxScore: 100,
                                    status: "pending",
                                    studentName: "James Omondi",
                                  },
                                  ...prev,
                                ]);
                              }
                              setCurrentPage("student-grades");
                            }}
                          />
                        );
                      })()}
                    {view === "tutor" &&
                      currentPage === "assignment-detail" &&
                      selectedAssignmentId &&
                      (() => {
                        const a = assignments.find(
                          (x) => x.id === selectedAssignmentId,
                        )!;
                        if (!a) return null;
                        return (
                          <AssignmentDetail
                            assignment={a}
                            onSubmit={() => {
                              // Record that some action happened; tutors won't 'submit' but keep analytics
                              setAdminItems((prev) => [
                                {
                                  id: `adm-action-${Date.now()}`,
                                  type: "assignment",
                                  ownerRole: "tutor",
                                  ownerName: "Dr. Sarah Kamau",
                                  description: `Viewed assignment: ${a.title}`,
                                  createdAt: new Date().toISOString(),
                                },
                                ...prev,
                              ]);
                            }}
                          />
                        );
                      })()}
                    {view === "student" && currentPage === "student-grades" && (
                      <StudentGrades grades={grades} />
                    )}
                    {view === "admin" && currentPage === "admin-uploads" && (
                      <AdminUploads items={adminItems} />
                    )}

                    {/* Student specific pages */}
                    {view === "student" && currentPage === "assignments" && (
                      <div className="space-y-6">
                        <h1 className="text-2xl font-bold">My Assignments</h1>
                        <p className="text-muted-foreground">
                          View and submit your assignments here.
                        </p>
                        {assignments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No assignments yet.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assignments.map((a) => {
                              const courseLabel =
                                typeof (a as any).courseId === "object"
                                  ? (a as any).courseId?.title ||
                                    "Unknown Course"
                                  : (a as any).courseId || "Unknown Course";

                              // Determine status based on due date and submission
                              let status:
                                | "pending"
                                | "submitted"
                                | "graded"
                                | "overdue" = (a as any).status || "pending";

                              if (
                                status === "pending" &&
                                a.dueDate &&
                                new Date(a.dueDate).getTime() < Date.now()
                              ) {
                                status = "overdue";
                              }

                              return (
                                <AssignmentCard
                                  key={a.id}
                                  id={a.id}
                                  title={a.title}
                                  courseName={courseLabel}
                                  dueDate={
                                    a.dueDate ? new Date(a.dueDate) : new Date()
                                  }
                                  status={status}
                                  grade={(a as any).grade}
                                  onSubmit={() => {
                                    setSelectedAssignmentId(a.id);
                                    setCurrentPage("assignment-detail");
                                  }}
                                  onView={() => {
                                    setSelectedAssignmentId(a.id);
                                    setCurrentPage("assignment-detail");
                                  }}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {view === "student" && currentPage === "announcements" && (
                      <div className="space-y-6">
                        <h1 className="text-2xl font-bold">Announcements</h1>
                        <p className="text-muted-foreground">
                          Stay updated with the latest announcements.
                        </p>
                      </div>
                    )}

                    {/* Tutor specific pages */}
                    {view === "tutor" && currentPage === "assignments" && (
                      <TutorDashboard
                        initialTab="assignments"
                        showHeader={false}
                        hideCourses={true}
                        hideStudents={true}
                        hideContent={true}
                        hideAnnouncements={true}
                        onNavigate={handleSidebarNavigation}
                        onOpenCourse={(id: string) => {
                          setSelectedCourseId(id);
                          setCurrentPage("course-detail");
                        }}
                        onOpenAssignment={(id: string) => {
                          setSelectedAssignmentId(id);
                          setCurrentPage("assignment-detail");
                        }}
                        onAddAssignment={(a: any) =>
                          setAssignments((prev) => [a, ...prev])
                        }
                        onUpdateAssignment={(a: any) =>
                          setAssignments((prev) =>
                            prev.map((x) =>
                              x.id === (a.id || a._id) ? { ...x, ...a } : x,
                            ),
                          )
                        }
                        onDeleteAssignment={(id: string) =>
                          setAssignments((prev) =>
                            prev.filter(
                              (x) =>
                                (x as any).id !== id && (x as any)._id !== id,
                            ),
                          )
                        }
                        assignmentsFromApp={assignments}
                        onAssignmentsChange={(a: any[]) => setAssignments(a)}
                      />
                    )}

                    {view === "tutor" && currentPage === "students" && (
                      <TutorDashboard
                        initialTab="students"
                        showHeader={false}
                        hideCourses={true}
                        hideAssignments={true}
                        hideContent={true}
                        hideAnnouncements={true}
                        onNavigate={handleSidebarNavigation}
                        onOpenCourse={(id: string) => {
                          setSelectedCourseId(id);
                          setCurrentPage("course-detail");
                        }}
                        onOpenAssignment={(id: string) => {
                          setSelectedAssignmentId(id);
                          setCurrentPage("assignment-detail");
                        }}
                        onAddAssignment={(a: any) =>
                          setAssignments((prev) => [a, ...prev])
                        }
                        onUpdateAssignment={(a: any) =>
                          setAssignments((prev) =>
                            prev.map((x) =>
                              x.id === (a.id || a._id) ? { ...x, ...a } : x,
                            ),
                          )
                        }
                        onDeleteAssignment={(id: string) =>
                          setAssignments((prev) =>
                            prev.filter(
                              (x) =>
                                (x as any).id !== id && (x as any)._id !== id,
                            ),
                          )
                        }
                        assignmentsFromApp={assignments}
                        onAssignmentsChange={(a: any[]) => setAssignments(a)}
                      />
                    )}

                    {view === "tutor" && currentPage === "analytics" && (
                      <Analytics />
                    )}

                    {/* Admin specific pages */}
                    {view === "admin" && currentPage === "users" && <Users />}

                    {view === "admin" && currentPage === "analytics" && (
                      <Analytics />
                    )}

                    {view === "admin" && currentPage === "settings" && (
                      <SystemSettings />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Toaster />
          </SidebarProvider>
        </PlanNotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
