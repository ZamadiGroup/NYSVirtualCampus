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
import Auth from "@/pages/Auth";
import StudentDashboard from "@/pages/StudentDashboard";
import TutorDashboard from "@/pages/TutorDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import CourseDetail from "@/pages/CourseDetail";
import CourseList from "@/pages/CourseList";
import CreateCourse from "@/pages/CreateCourse";
import CreateAssignment, { type AssignmentDraft } from "@/pages/CreateAssignment";
import AssignmentDetail, { type Assignment } from "@/pages/AssignmentDetail";
import StudentGrades, { type GradeRecord } from "@/pages/StudentGrades";
import AdminUploads from "@/pages/AdminUploads";
import ManageAssignments from "@/pages/ManageAssignments";
import TutorGrades from "@/pages/TutorGrades";
import Announcements, { type Announcement } from "@/pages/Announcements";
import { useAuth } from "@/lib/useAuth";
import { getCurrentUser } from '@/lib/auth';
import LoginDialog from "@/components/LoginDialog";


function App() {
  // removed demo role-switcher: derive view from authenticated user or default to 'student'
  const [currentPage, setCurrentPage] = useState<
    | "homepage"
    | "auth"
    | "dashboard" 
    | "courses"
    | "course-detail"
    | "assignments"
    | "announcements"
    | "students"
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
  >("homepage");

  // In-memory demo state for assignments, submissions, grades, and admin visibility
  type AssignmentWithDue = Assignment & { dueDate?: string };
  const [assignments, setAssignments] = useState<AssignmentWithDue[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [tutorGrades, setTutorGrades] = useState<(GradeRecord & { studentName: string })[]>([]);
  const [adminItems, setAdminItems] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const userNames = {
    student: "James Omondi",
    tutor: "Dr. Sarah Kamau",
    admin: "System Administrator",
  };

  const handleSidebarNavigation = (page: string) => {
    setCurrentPage(page as any);
  };

  const { user, isAuthenticated, logout, refresh } = useAuth();
  // Normalize role: server may return 'lecturer' or 'tutor' for teaching staff.
  const normalizeRole = (r: string | undefined | null) => {
    if (!r) return 'student';
    if (r === 'admin') return 'admin';
    if (r === 'tutor' || r === 'lecturer') return 'tutor';
    return 'student';
  };

  const view = normalizeRole(user?.role as string | undefined);

  // Sync hash-based navigation for simple full-page auth routing (e.g. #auth)
  useEffect(() => {
    const applyHash = () => {
      try {
        const h = window.location.hash.replace(/^#/, '');
        if (h === 'auth') setCurrentPage('auth');
      } catch (e) {
        // ignore
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PlanNotificationProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              {/* Hide sidebar on the auth page for a full-page auth experience */}
              {currentPage !== 'auth' && (
                <AppSidebar userRole={view} userName={userNames[view]} onNavigate={handleSidebarNavigation} currentPage={currentPage} />
              )}
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Hide navigation (sidebar/header) for the full-page auth view */}
                {currentPage !== 'auth' && <Header />}

              <div className="flex-1 overflow-auto bg-background">
                <div className="container mx-auto p-6 max-w-7xl">
                  {currentPage === "homepage" && (
                    <Homepage 
                      userRole={view} 
                      userName={userNames[view]} 
                      onNavigate={handleSidebarNavigation} 
                    />
                  )}

                  {/* Full-page auth: remove header/sidebar and navigate to correct portal on login */}
                  {currentPage === 'auth' && (
                    <Auth onLogin={() => {
                      // Refresh hook state and immediately read current user to decide routing
                      try { refresh(); } catch (e) {}
                      const newUser = getCurrentUser();
                      const mapped = normalizeRole(newUser?.role);
                      // Ensure dashboard shows the right portal
                      setCurrentPage('dashboard');
                      // reset hash if present
                      try { window.location.hash = ''; } catch (e) {}
                      // Optionally you could set other state here based on role
                    }} />
                  )}

                  {currentPage === "dashboard" && (
                    <>
                      {view === "student" && <StudentDashboard />}
                      {view === "tutor" && (
                        <TutorDashboard onNavigate={handleSidebarNavigation} />
                      )}
                      {view === "admin" && <AdminDashboard />}
                    </>
                  )}

                  {currentPage === "courses" && <CourseList userRole={view} />}
                  {currentPage === "course-detail" && <CourseDetail />}
                  {(view === "tutor" || view === "admin") && currentPage === "create-course" && (
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
                  {view === "tutor" && currentPage === "create-assignment" && (
                    <CreateAssignment
                      onCancel={() => setCurrentPage("dashboard")}
                      onCreated={(draft: AssignmentDraft) => {
                        const newAssignment: AssignmentWithDue = {
                          id: `${Date.now()}`,
                          courseId: draft.courseId,
                          title: draft.title,
                          type: draft.type,
                          instructions: draft.instructions,
                          questions: draft.questions.map((q) => ({ text: q.text, imageUrl: q.imageUrl, choices: q.choices })),
                          dueDate: draft.dueDate,
                        };
                        setAssignments((prev) => [newAssignment, ...prev]);
                        setAdminItems((prev) => [
                          {
                            id: `adm-${Date.now()}`,
                            type: "assignment",
                            ownerRole: "tutor",
                            ownerName: "Dr. Sarah Kamau",
                            description: `Assignment created: ${newAssignment.title}`,
                            createdAt: new Date().toISOString(),
                          },
                          ...prev,
                        ]);
                        setCurrentPage("dashboard");
                      }}
                    />
                  )}
                  {view === "tutor" && currentPage === "manage-assignments" && (
                    <ManageAssignments
                      assignments={assignments.map((a) => ({ id: a.id, courseId: a.courseId, title: a.title, dueDate: a.dueDate }))}
                      onExtendDueDate={(id, newDue) => {
                        setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, dueDate: newDue } : a)));
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
                  {view === "tutor" && currentPage === "tutor-grades" && (
                    <TutorGrades
                      grades={tutorGrades}
                      onUpdateManual={(assignmentId, studentName, score) => {
                        setTutorGrades((prev) => prev.map((g) => (g.assignmentId === assignmentId && g.studentName === studentName ? { ...g, manualScore: score, status: "graded" } : g)));
                        const a = assignments.find((x) => x.id === assignmentId);
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
                      authorRole={view === "admin" ? "admin" : view === "tutor" ? "tutor" : undefined}
                      authorName={userNames[view]}
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
                  {view === "student" && currentPage === "assignment-detail" && selectedAssignmentId && (
                    (() => {
                      const a = assignments.find((x) => x.id === selectedAssignmentId)!;
                      if (a.dueDate && new Date(a.dueDate).getTime() < Date.now()) {
                        return (
                          <Card>
                            <CardHeader>
                              <CardTitle>Assignment Closed</CardTitle>
                            </CardHeader>
                            <CardContent>
                              This assignment is no longer available because the deadline has passed.
                            </CardContent>
                          </Card>
                        );
                      }
                      return (
                        <AssignmentDetail
                      assignment={a}
                      onSubmit={(submission) => {
                        // Auto grade if type is auto (simple string match)
                        const a = assignments.find((x) => x.id === selectedAssignmentId)!;
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
                          const score = Object.values(submission.answers || {}).filter((v) => (v as string).trim()).length;
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
                    })()
                  )}
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
                      <p className="text-muted-foreground">View and submit your assignments here.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assignments
                          .filter((a) => !a.dueDate || new Date(a.dueDate).getTime() >= Date.now())
                          .map((a) => (
                          <Card key={a.id} className="p-4">
                            <div className="space-y-2">
                              <h3 className="font-semibold">{a.title}</h3>
                              <p className="text-sm text-muted-foreground">Course: {a.courseId} • Type: {a.type}</p>
                              <Button onClick={() => { setSelectedAssignmentId(a.id); setCurrentPage("assignment-detail"); }}>
                                Open
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {view === "student" && currentPage === "announcements" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">Announcements</h1>
                      <p className="text-muted-foreground">Stay updated with the latest announcements.</p>
                    </div>
                  )}

                  {/* Tutor specific pages */}
                  {view === "tutor" && currentPage === "assignments" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">Assignment Management</h1>
                      <p className="text-muted-foreground">Create and manage assignments for your students.</p>
                    </div>
                  )}
                  
                  {view === "tutor" && currentPage === "students" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">My Students</h1>
                      <p className="text-muted-foreground">View and manage your students.</p>
                    </div>
                  )}
                  
                  {view === "tutor" && currentPage === "analytics" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">Analytics</h1>
                      <p className="text-muted-foreground">View performance analytics and insights.</p>
                    </div>
                  )}

                  {/* Admin specific pages */}
                  {view === "admin" && currentPage === "users" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">User Management</h1>
                      <p className="text-muted-foreground">Manage users, roles, and permissions.</p>
                    </div>
                  )}
                  
                  {view === "admin" && currentPage === "analytics" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">System Analytics</h1>
                      <p className="text-muted-foreground">View system-wide analytics and reports.</p>
                    </div>
                  )}
                  
                  {view === "admin" && currentPage === "settings" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">System Settings</h1>
                      <p className="text-muted-foreground">Configure system settings and preferences.</p>
                    </div>
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
