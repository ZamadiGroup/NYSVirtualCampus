import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { coursesApi, usersApi, announcementsApi } from "@/lib/api";
import {
  Settings,
  Database,
  Users,
  BookOpen,
  Bell,
  Shield,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface SystemStats {
  totalUsers: number;
  students: number;
  tutors: number;
  admins: number;
  graduatedStudents: number;
  totalCourses: number;
  activeCourses: number;
  archivedCourses: number;
  totalAnnouncements: number;
}

export default function SystemSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    students: 0,
    tutors: 0,
    admins: 0,
    graduatedStudents: 0,
    totalCourses: 0,
    activeCourses: 0,
    archivedCourses: 0,
    totalAnnouncements: 0,
  });
  const [dbStatus, setDbStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");

  // Settings state
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(true);
  const [requireEmailVerification, setRequireEmailVerification] =
    useState(false);
  const [defaultUserRole, setDefaultUserRole] = useState("student");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    setLoading(true);
    setDbStatus("checking");

    try {
      // Load users
      const users = await usersApi.getAll();
      const usersList = Array.isArray(users) ? users : [];
      const students = usersList.filter(
        (u: any) => u.role === "student" && !u.isGraduated,
      );
      const tutors = usersList.filter((u: any) => u.role === "tutor");
      const admins = usersList.filter((u: any) => u.role === "admin");
      const graduated = usersList.filter((u: any) => u.isGraduated);

      // Load courses
      const courses = await coursesApi.getAll();
      const coursesList = Array.isArray(courses) ? courses : [];
      const activeCourses = coursesList.filter(
        (c: any) => !c.archived && c.isActive !== false,
      );
      const archivedCourses = coursesList.filter((c: any) => c.archived);

      // Load announcements
      let announcementCount = 0;
      try {
        const announcements = await announcementsApi.getAll();
        announcementCount = Array.isArray(announcements)
          ? announcements.length
          : 0;
      } catch {
        announcementCount = 0;
      }

      setStats({
        totalUsers: usersList.length,
        students: students.length,
        tutors: tutors.length,
        admins: admins.length,
        graduatedStudents: graduated.length,
        totalCourses: coursesList.length,
        activeCourses: activeCourses.length,
        archivedCourses: archivedCourses.length,
        totalAnnouncements: announcementCount,
      });

      setDbStatus("connected");
    } catch (err) {
      console.error("Failed to load system data:", err);
      setDbStatus("disconnected");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    toast({ title: "Refreshing...", description: "Reloading system data" });
    await loadSystemData();
    toast({ title: "Refreshed", description: "System data updated" });
  };

  const handleExportData = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      stats,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Exported",
      description: "System data exported successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings, view statistics, and manage the platform
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Database Status
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {dbStatus === "checking" ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Checking...</span>
                  </div>
                ) : dbStatus === "connected" ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      Connected
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-600">
                      Disconnected
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  MongoDB Atlas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.students} students, {stats.tutors} tutors,{" "}
                  {stats.admins} admins
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Courses
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeCourses} active, {stats.archivedCourses} archived
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Announcements
                </CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalAnnouncements}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total announcements
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleRefreshData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="mr-2 h-4 w-4" />
                Export Stats
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.students}</div>
                <Badge variant="default" className="mt-2">
                  Active
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Graduated Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.graduatedStudents}
                </div>
                <Badge variant="secondary" className="mt-2">
                  Graduated
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tutors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.tutors}</div>
                <Badge variant="outline" className="mt-2">
                  Instructors
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Administrators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.admins}</div>
                <Badge variant="destructive" className="mt-2">
                  Admin
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Self-Registration</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow new users to register without admin approval
                  </p>
                </div>
                <Switch
                  checked={allowSelfRegistration}
                  onCheckedChange={setAllowSelfRegistration}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Email Verification</Label>
                  <p className="text-xs text-muted-foreground">
                    Users must verify email before accessing the system
                  </p>
                </div>
                <Switch
                  checked={requireEmailVerification}
                  onCheckedChange={setRequireEmailVerification}
                />
              </div>

              <div>
                <Label>Default User Role</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Role assigned to new registrations
                </p>
                <div className="flex gap-2">
                  {["student", "tutor"].map((role) => (
                    <Button
                      key={role}
                      variant={defaultUserRole === role ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDefaultUserRole(role)}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats.activeCourses}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently published
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Archived Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {stats.archivedCourses}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Hidden from students
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All courses in system
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Course Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage courses from the Courses page. Use the course management
                dialog to:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Transfer students between courses</li>
                <li>Assign instructors</li>
                <li>Archive or restore courses</li>
                <li>Configure enrollment settings</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Disable access for non-admin users during maintenance
                  </p>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>

              {maintenanceMode && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    ⚠️ Maintenance mode is enabled
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Only administrators can access the system
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Database Type</p>
                  <p className="font-medium">MongoDB Atlas</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium flex items-center gap-1">
                    {dbStatus === "connected" ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Connected
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        Disconnected
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Collections</p>
                  <p className="font-medium">
                    Users, Courses, Assignments, Submissions, Announcements
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Refresh</p>
                  <p className="font-medium">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                These actions are irreversible. Use with extreme caution.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Not implemented",
                      description:
                        "This feature requires additional backend support",
                      variant: "destructive",
                    });
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
