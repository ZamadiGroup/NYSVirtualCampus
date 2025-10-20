import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StudentDashboard from "@/pages/StudentDashboard";
import TutorDashboard from "@/pages/TutorDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import CourseDetail from "@/pages/CourseDetail";
import CourseList from "@/pages/CourseList";

function App() {
  const [currentView, setCurrentView] = useState<"student" | "tutor" | "admin">("student");
  const [currentPage, setCurrentPage] = useState<"dashboard" | "courses" | "course-detail">("dashboard");

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const userNames = {
    student: "James Omondi",
    tutor: "Dr. Sarah Kamau",
    admin: "System Administrator",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar userRole={currentView} userName={userNames[currentView]} />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between gap-4 p-4 border-b border-border bg-card">
                <div className="flex items-center gap-2">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="hidden md:block">
                    <h2 className="font-semibold text-sm">NYS Virtual Campus</h2>
                    <p className="text-xs text-muted-foreground">National Youth Service Kenya</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Card className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Demo Mode:</span>
                      <Badge variant="outline" className="text-xs">{currentView}</Badge>
                    </div>
                  </Card>
                  <ThemeToggle />
                </div>
              </header>

              <div className="flex-1 overflow-auto bg-background">
                <div className="container mx-auto p-6 max-w-7xl">
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-base">Demo Navigation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Select User Role:</p>
                        <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as any)}>
                          <TabsList>
                            <TabsTrigger value="student" data-testid="tab-role-student">
                              Student View
                            </TabsTrigger>
                            <TabsTrigger value="tutor" data-testid="tab-role-tutor">
                              Tutor View
                            </TabsTrigger>
                            <TabsTrigger value="admin" data-testid="tab-role-admin">
                              Admin View
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Select Page:</p>
                        <Tabs value={currentPage} onValueChange={(v) => setCurrentPage(v as any)}>
                          <TabsList>
                            <TabsTrigger value="dashboard" data-testid="tab-page-dashboard">
                              Dashboard
                            </TabsTrigger>
                            <TabsTrigger value="courses" data-testid="tab-page-courses">
                              Course List
                            </TabsTrigger>
                            <TabsTrigger value="course-detail" data-testid="tab-page-course-detail">
                              Course Detail
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </CardContent>
                  </Card>

                  {currentPage === "dashboard" && (
                    <>
                      {currentView === "student" && <StudentDashboard />}
                      {currentView === "tutor" && <TutorDashboard />}
                      {currentView === "admin" && <AdminDashboard />}
                    </>
                  )}

                  {currentPage === "courses" && <CourseList />}
                  {currentPage === "course-detail" && <CourseDetail />}
                </div>
              </div>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
