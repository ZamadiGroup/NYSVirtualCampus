import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  BookOpen,
  GraduationCap,
  Trash2,
  UserPlus,
  UserCog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AddUserDialog } from "@/components/AddUserDialog";
import { AddCourseDialog } from "@/components/AddCourseDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { usersApi, coursesApi, type ApiUser, type ApiCourse } from "@/lib/api";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [tutors, setTutors] = useState<ApiUser[]>([]);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [enrollCourse, setEnrollCourse] = useState<ApiCourse | null>(null);
  const [enrollStudent, setEnrollStudent] = useState<string>("");
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferCourse, setTransferCourse] = useState<ApiCourse | null>(null);
  const [transferToTutor, setTransferToTutor] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set(),
  );
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const res = await usersApi.getAll().catch(() => []);
      const normalized = Array.isArray(res)
        ? res.map((u: any) => ({ ...u, id: (u as any).id || (u as any)._id }))
        : [];
      setUsers(normalized);
      setTutors(normalized.filter((u) => u.role === "tutor"));
    } catch (e) {
      console.warn("Failed to load users", e);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      const res = await coursesApi.getAll().catch(() => []);
      const normalized = Array.isArray(res)
        ? res.map((c: any) => ({ ...c, id: (c as any).id || (c as any)._id }))
        : [];
      setCourses(normalized);
    } catch (e) {
      console.warn("Failed to load courses", e);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadCourses();
  }, [loadUsers, loadCourses]);

  const stats = useMemo(() => {
    return {
      totalUsers: users.length,
      activeCourses: courses.filter((c) => c.isActive !== false).length,
      totalTutors: users.filter((u) => u.role === "tutor").length,
      totalStudents: users.filter((u) => u.role === "student").length,
    };
  }, [users, courses]);

  const handleGraduateStudent = async (userId: string, fullName: string) => {
    try {
      const response = await usersApi.graduate(userId);
      const coursesRemoved = (response as any)?.removedFromCourses || 0;
      toast({
        title: "Student graduated",
        description: `${fullName} has been graduated and removed from ${coursesRemoved} course(s)`,
      });
      loadUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to graduate student",
        variant: "destructive",
      });
    }
  };

  const handleEnrollStudent = async () => {
    if (!enrollCourse || !enrollStudent) {
      toast({
        title: "Error",
        description: "Select both course and student",
        variant: "destructive",
      });
      return;
    }
    try {
      setSaving(true);
      const student = users.find((u) => u.id === enrollStudent);
      const updatedEnrollEmails = [
        ...(enrollCourse.enrollEmails || []),
        student?.email || "",
      ];
      await coursesApi.update(enrollCourse.id, {
        enrollEmails: updatedEnrollEmails,
      });
      toast({
        title: "Enrolled",
        description: `${student?.fullName} enrolled in ${enrollCourse.title}`,
      });
      setIsEnrollDialogOpen(false);
      setEnrollStudent("");
      setEnrollCourse(null);
      loadCourses();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to enroll",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async (course: ApiCourse) => {
    try {
      await coursesApi.update(course.id, { isActive: !course.isActive });
      toast({
        title: course.isActive ? "Unpublished" : "Published",
        description: course.title,
      });
      loadCourses();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to toggle publish",
        variant: "destructive",
      });
    }
  };

  const handleMandatoryToggle = async (course: ApiCourse) => {
    try {
      await coursesApi.update(course.id, { isMandatory: !course.isMandatory });
      toast({
        title: course.isMandatory ? "Marked optional" : "Marked mandatory",
        description: course.title,
      });
      loadCourses();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to toggle mandatory",
        variant: "destructive",
      });
    }
  };

  const handleAssignFacilitator = async (courseId: string, tutorId: string) => {
    try {
      await coursesApi.update(courseId, { instructorId: tutorId });
      const tutor = tutors.find((t) => t.id === tutorId);
      toast({
        title: "Facilitator assigned",
        description: tutor?.fullName || "Success",
      });
      loadCourses();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to assign facilitator",
        variant: "destructive",
      });
    }
  };

  const handleTransfer = async () => {
    if (!transferCourse || !transferToTutor || selectedStudents.size === 0) {
      toast({
        title: "Error",
        description: "Select course, tutor, and at least one student",
        variant: "destructive",
      });
      return;
    }
    try {
      setSaving(true);
      await coursesApi.update(transferCourse.id, {
        instructorId: transferToTutor,
      });
      toast({
        title: "Transfer complete",
        description: `${selectedStudents.size} students transferred to new tutor`,
      });
      setIsTransferDialogOpen(false);
      setTransferCourse(null);
      setTransferToTutor("");
      setSelectedStudents(new Set());
      loadCourses();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to transfer",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!confirm(`Delete course "${title}"? This cannot be undone.`)) return;
    try {
      await coursesApi.delete(courseId);
      toast({ title: "Deleted", description: title });
      loadCourses();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            System overview and management
          </p>
        </div>
        <div className="flex gap-2">
          <AddUserDialog onUserAdded={loadUsers} />
          <AddCourseDialog onCourseAdded={loadCourses} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          accentColor="primary"
        />
        <StatCard
          title="Active Courses"
          value={stats.activeCourses}
          icon={BookOpen}
          accentColor="chart-3"
        />
        <StatCard
          title="Total Tutors"
          value={stats.totalTutors}
          icon={GraduationCap}
          accentColor="chart-2"
        />
        <StatCard
          title="Students"
          value={stats.totalStudents}
          icon={Users}
          accentColor="primary"
        />
      </div>

      {/* Tabs for Management */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="allCourses">All Courses</TabsTrigger>
          <TabsTrigger value="manageCourses">Manage Courses</TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 flex items-center justify-between border rounded hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.fullName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || user.username?.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.fullName || user.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          user.role === "admin"
                            ? "destructive"
                            : user.role === "tutor"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {user.role}
                      </Badge>
                      {user.role === "student" && !user.isGraduated && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleGraduateStudent(user.id, user.fullName)
                          }
                        >
                          Graduate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Courses Tab */}
        <TabsContent value="allCourses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Courses ({courses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {courses.map((course) => {
                  const instructor = users.find(
                    (u) => u.id === course.instructorId,
                  );
                  return (
                    <div
                      key={course.id}
                      className="p-4 border rounded hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{course.title}</h4>
                            {course.isMandatory && (
                              <Badge variant="destructive">Mandatory</Badge>
                            )}
                            <Badge variant="outline">
                              {course.department || "N/A"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {course.description || "No description"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Facilitator: {instructor?.fullName || "Unassigned"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={course.instructorId || ""}
                            onValueChange={(val) =>
                              handleAssignFacilitator(course.id, val)
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Assign Facilitator" />
                            </SelectTrigger>
                            <SelectContent>
                              {tutors.map((tutor) => (
                                <SelectItem key={tutor.id} value={tutor.id}>
                                  {tutor.fullName || tutor.username}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleDeleteCourse(course.id, course.title)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Courses Tab */}
        <TabsContent value="manageCourses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Manage Courses</CardTitle>
                <div className="flex gap-2">
                  <Dialog
                    open={isEnrollDialogOpen}
                    onOpenChange={setIsEnrollDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Enroll Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enroll Student in Course</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Course</Label>
                          <Select
                            value={enrollCourse?.id || ""}
                            onValueChange={(val) =>
                              setEnrollCourse(
                                courses.find((c) => c.id === val) || null,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Student</Label>
                          <Select
                            value={enrollStudent}
                            onValueChange={setEnrollStudent}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                            <SelectContent>
                              {users
                                .filter((u) => u.role === "student")
                                .map((u) => (
                                  <SelectItem key={u.id} value={u.id}>
                                    {u.fullName || u.username}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={handleEnrollStudent}
                          className="w-full"
                          disabled={saving}
                        >
                          Enroll
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog
                    open={isTransferDialogOpen}
                    onOpenChange={setIsTransferDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <UserCog className="h-4 w-4 mr-2" />
                        Bulk Transfer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Bulk Transfer Students</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Course</Label>
                          <Select
                            value={transferCourse?.id || ""}
                            onValueChange={(val) =>
                              setTransferCourse(
                                courses.find((c) => c.id === val) || null,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Transfer To Tutor</Label>
                          <Select
                            value={transferToTutor}
                            onValueChange={setTransferToTutor}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select tutor" />
                            </SelectTrigger>
                            <SelectContent>
                              {tutors.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.fullName || t.username}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Select Students</Label>
                          <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-2">
                            {users
                              .filter((u) => u.role === "student")
                              .map((u) => (
                                <div
                                  key={u.id}
                                  className="flex items-center gap-2"
                                >
                                  <Checkbox
                                    checked={selectedStudents.has(u.id)}
                                    onCheckedChange={(checked) => {
                                      const newSet = new Set(selectedStudents);
                                      if (checked) newSet.add(u.id);
                                      else newSet.delete(u.id);
                                      setSelectedStudents(newSet);
                                    }}
                                  />
                                  <span className="text-sm">
                                    {u.fullName || u.username}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                        <Button
                          onClick={handleTransfer}
                          className="w-full"
                          disabled={saving}
                        >
                          Transfer {selectedStudents.size} Student(s)
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {courses.map((course) => {
                  const instructor = users.find(
                    (u) => u.id === course.instructorId,
                  );
                  return (
                    <div key={course.id} className="p-4 border rounded">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{course.title}</h4>
                            <Badge
                              variant={
                                course.isActive ? "default" : "secondary"
                              }
                            >
                              {course.isActive ? "Published" : "Unpublished"}
                            </Badge>
                            {course.isMandatory && (
                              <Badge variant="destructive">Mandatory</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {course.description || "No description"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Facilitator: {instructor?.fullName || "Unassigned"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Enrolled: {course.enrollEmails?.length || 0}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={course.isActive ? "secondary" : "default"}
                            onClick={() => handlePublishToggle(course)}
                          >
                            {course.isActive ? "Unpublish" : "Publish"}
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              course.isMandatory ? "outline" : "destructive"
                            }
                            onClick={() => handleMandatoryToggle(course)}
                          >
                            {course.isMandatory ? "Optional" : "Mandatory"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
