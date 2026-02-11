import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  usersApi,
  coursesApi,
  enrollmentsApi,
  type ApiUser,
  type ApiCourse,
} from "@/lib/api";
import {
  Users,
  BookOpen,
  GraduationCap,
  UserCog,
  Clock,
  Search,
} from "lucide-react";

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

export default function Analytics() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [tutors, setTutors] = useState<ApiUser[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  const currentUser = parseJwt(token) as any;
  const isTutor = currentUser?.role === "tutor";
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    async function load() {
      try {
        if (isTutor) {
          const [fetchedCourses, fetchedEnrollments] = await Promise.all([
            coursesApi.getMine().catch(() => []),
            enrollmentsApi.getAll().catch(() => []),
          ]);
          const normalizedCourses = Array.isArray(fetchedCourses)
            ? fetchedCourses.map((c: any) => ({
                ...c,
                id: (c as any).id || (c as any)._id,
                instructorId: (c as any).instructorId?._id
                  ? String((c as any).instructorId._id)
                  : String((c as any).instructorId || ""),
              }))
            : [];
          const normalizedEnrollments = Array.isArray(fetchedEnrollments)
            ? fetchedEnrollments.map((e: any) => ({
                _id: e._id,
                id: e._id || e.id,
                studentId: e.studentId?._id
                  ? String(e.studentId._id)
                  : String(e.studentId || ""),
                courseId: e.courseId?._id
                  ? String(e.courseId._id)
                  : String(e.courseId || ""),
              }))
            : [];

          setCourses(normalizedCourses);
          setEnrollments(normalizedEnrollments);

          const tutorUser: ApiUser = {
            id: String(currentUser?.userId || currentUser?.id || ""),
            username: currentUser?.username || "",
            fullName: currentUser?.fullName || currentUser?.name || "Tutor",
            role: "tutor",
          } as ApiUser;
          setUsers([tutorUser]);
          setTutors([tutorUser]);
          return;
        }

        const [fetchedUsers, fetchedCourses, fetchedEnrollments] =
          await Promise.all([
            usersApi.getAll().catch(() => []),
            coursesApi.getAll().catch(() => []),
            enrollmentsApi.getAll().catch(() => []),
          ]);

        const normalizedUsers = Array.isArray(fetchedUsers)
          ? fetchedUsers.map((u: any) => ({
              ...u,
              id: (u as any).id || (u as any)._id,
            }))
          : [];
        const normalizedCourses = Array.isArray(fetchedCourses)
          ? fetchedCourses.map((c: any) => ({
              ...c,
              id: (c as any).id || (c as any)._id,
              instructorId: (c as any).instructorId?._id
                ? String((c as any).instructorId._id)
                : String((c as any).instructorId || ""),
            }))
          : [];
        const normalizedEnrollments = Array.isArray(fetchedEnrollments)
          ? fetchedEnrollments.map((e: any) => ({
              _id: e._id,
              id: e._id || e.id,
              studentId: e.studentId?._id
                ? String(e.studentId._id)
                : String(e.studentId || ""),
              courseId: e.courseId?._id
                ? String(e.courseId._id)
                : String(e.courseId || ""),
            }))
          : [];

        setUsers(normalizedUsers);
        setCourses(normalizedCourses);
        setEnrollments(normalizedEnrollments);

        // Extract tutors
        const tutorList = normalizedUsers.filter((u) => u.role === "tutor");
        setTutors(tutorList);
      } catch (err) {
        console.warn("Failed to load analytics data", err);
      }
    }
    load();
  }, [
    isTutor,
    currentUser?.userId,
    currentUser?.id,
    currentUser?.fullName,
    currentUser?.username,
  ]);

  // User Stats
  const userStats = useMemo(() => {
    return {
      total: users.length,
      students: users.filter((u) => u.role === "student").length,
      tutors: users.filter((u) => u.role === "tutor").length,
      admins: users.filter((u) => u.role === "admin").length,
    };
  }, [users]);

  // Course Stats with calculated values
  const courseStats = useMemo(() => {
    const totalEnrolled = enrollments.length;
    const totalDurationHours = courses.reduce(
      (sum, c) => sum + (c.duration || 0),
      0,
    );
    const mandatoryCourses = courses.filter(
      (c) => c.isMandatory === true,
    ).length;

    return {
      total: courses.length,
      mandatory: mandatoryCourses,
      totalEnrolled,
      totalDurationHours,
    };
  }, [courses, enrollments]);

  const enrollmentCountsByCourse = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of enrollments) {
      const courseId = String(e.courseId || "");
      map.set(courseId, (map.get(courseId) || 0) + 1);
    }
    return map;
  }, [enrollments]);

  // Aggregations
  const coursesByDepartment = useMemo(() => {
    const map = new Map<string, number>();
    for (const course of courses) {
      const dept = course.department || "Unknown";
      map.set(dept, (map.get(dept) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);
  }, [courses]);

  const coursesByTutor = useMemo(() => {
    const map = new Map<string, { tutorName: string; count: number }>();
    for (const course of courses) {
      const instructor = users.find((u) => u.id === course.instructorId);
      const tutorName =
        instructor?.fullName || instructor?.username || "Unknown";
      const existing = map.get(course.instructorId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(course.instructorId, { tutorName, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [courses, users]);

  // Filtered courses based on tutor and search
  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Filter by selected tutor
    if (selectedTutor !== "all") {
      filtered = filtered.filter((c) => c.instructorId === selectedTutor);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title?.toLowerCase().includes(term) ||
          c.description?.toLowerCase().includes(term) ||
          c.department?.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [courses, selectedTutor, searchTerm]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          {isTutor ? "Tutor Analytics" : "Analytics Dashboard"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isTutor
            ? "Your course performance and enrollment insights"
            : "System-wide insights and statistics"}
        </p>
      </div>

      {/* System Overview */}
      {!isTutor && (
        <div>
          <h2 className="text-xl font-semibold mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold">{userStats.total}</p>
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
                      Students
                    </p>
                    <p className="text-2xl font-bold">{userStats.students}</p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tutors
                    </p>
                    <p className="text-2xl font-bold">{userStats.tutors}</p>
                  </div>
                  <UserCog className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Admins
                    </p>
                    <p className="text-2xl font-bold">{userStats.admins}</p>
                  </div>
                  <Users className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Courses
                    </p>
                    <p className="text-2xl font-bold">{courseStats.total}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {isTutor && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      My Courses
                    </p>
                    <p className="text-2xl font-bold">{courseStats.total}</p>
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
                      Students
                    </p>
                    <p className="text-2xl font-bold">
                      {
                        Array.from(
                          new Set(enrollments.map((e) => String(e.studentId))),
                        ).length
                      }
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Enrollments
                    </p>
                    <p className="text-2xl font-bold">
                      {courseStats.totalEnrolled}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Duration (Hours)
                    </p>
                    <p className="text-2xl font-bold">
                      {courseStats.totalDurationHours}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Course Analytics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Course Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Courses
                  </p>
                  <p className="text-2xl font-bold">{courseStats.total}</p>
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
                    Mandatory Courses
                  </p>
                  <p className="text-2xl font-bold">{courseStats.mandatory}</p>
                </div>
                <BookOpen className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Enrollments
                  </p>
                  <p className="text-2xl font-bold">
                    {courseStats.totalEnrolled}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Duration (Hours)
                  </p>
                  <p className="text-2xl font-bold">
                    {courseStats.totalDurationHours}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Tutor Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Courses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`grid grid-cols-1 ${isTutor ? "" : "md:grid-cols-2"} gap-4`}
          >
            <div className="space-y-2">
              <Label htmlFor="search">Search Courses</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title, description, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {!isTutor && (
              <div className="space-y-2">
                <Label htmlFor="tutor-filter">Filter by Tutor</Label>
                <Select value={selectedTutor} onValueChange={setSelectedTutor}>
                  <SelectTrigger>
                    <SelectValue placeholder="All tutors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tutors</SelectItem>
                    {tutors.map((tutor) => (
                      <SelectItem key={tutor.id} value={tutor.id}>
                        {tutor.fullName || tutor.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Course Breakdown Tabs */}
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown">
            Course Breakdown ({filteredCourses.length})
          </TabsTrigger>
          <TabsTrigger value="byDepartment">By Department</TabsTrigger>
          {!isTutor && <TabsTrigger value="byTutor">By Tutor</TabsTrigger>}
        </TabsList>

        {/* Course Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <h3 className="text-lg font-semibold">
            All Courses ({filteredCourses.length})
          </h3>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredCourses.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No courses found</p>
                  </div>
                ) : (
                  filteredCourses.map((course) => {
                    const instructor = users.find(
                      (u) => u.id === course.instructorId,
                    );
                    const enrolledCount =
                      enrollmentCountsByCourse.get(String(course.id)) || 0;
                    return (
                      <div key={course.id} className="p-4 hover:bg-muted/50">
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
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>
                                Instructor:{" "}
                                {instructor?.fullName ||
                                  (isTutor ? "You" : "Unknown")}
                              </span>
                              {course.duration && (
                                <span>Duration: {course.duration}h</span>
                              )}
                              <span>Enrolled: {enrolledCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Department Tab */}
        <TabsContent value="byDepartment" className="space-y-4">
          <h3 className="text-lg font-semibold">Courses by Department</h3>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {coursesByDepartment.map(({ department, count }) => (
                  <div
                    key={department}
                    className="p-4 flex items-center justify-between hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{department}</p>
                      <p className="text-sm text-muted-foreground">
                        {count} course{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge>{count}</Badge>
                  </div>
                ))}
                {coursesByDepartment.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No departments found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {!isTutor && (
          <TabsContent value="byTutor" className="space-y-4">
            <h3 className="text-lg font-semibold">Courses by Tutor</h3>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {coursesByTutor.map(({ tutorName, count }) => (
                    <div
                      key={tutorName}
                      className="p-4 flex items-center justify-between hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{tutorName}</p>
                        <p className="text-sm text-muted-foreground">
                          {count} course{count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                  {coursesByTutor.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <UserCog className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No tutors found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
