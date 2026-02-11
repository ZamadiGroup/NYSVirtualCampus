import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { coursesApi, usersApi, type ApiCourse, type ApiUser } from "@/lib/api";
import {
  Settings,
  Users,
  FileText,
  BarChart3,
  Copy,
  Archive,
  Wrench,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Shield,
  Download,
  Upload,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface CourseManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  onUpdate?: () => void;
}

export function CourseManagementDialog({
  isOpen,
  onOpenChange,
  courseId,
  courseTitle,
  onUpdate,
}: CourseManagementDialogProps) {
  const { toast } = useToast();
  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [tutors, setTutors] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Setup state
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [enrollmentKey, setEnrollmentKey] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("Standard");

  // Configure state
  const [allowSelfEnroll, setAllowSelfEnroll] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [isMandatory, setIsMandatory] = useState(false);

  // Populate state
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [allCourses, setAllCourses] = useState<ApiCourse[]>([]);
  const [transferFromCourse, setTransferFromCourse] = useState("");

  // Archived courses state
  const [archivedCourses, setArchivedCourses] = useState<ApiCourse[]>([]);

  useEffect(() => {
    if (isOpen && courseId) {
      loadCourseData();
      loadUsers();
    }
  }, [isOpen, courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const data: any = await coursesApi.getById(courseId);
      const normalized = Object.assign({}, data, {
        id: data.id || data._id,
      }) as ApiCourse;
      setCourse(normalized);
      setEnrollmentKey(normalized.enrollmentKey || "");
      setIsPublished(normalized.isActive !== false);
      setIsMandatory(normalized.isMandatory === true);
      // Handle instructorId being either a string or populated object
      const instructorId =
        typeof normalized.instructorId === "object"
          ? (normalized.instructorId as any)?._id ||
            (normalized.instructorId as any)?.id
          : normalized.instructorId;
      setSelectedInstructor(instructorId || "");
      // Load template and dates
      setSelectedTemplate((normalized as any).template || "Standard");
      if ((normalized as any).startDate)
        setStartDate(new Date((normalized as any).startDate));
      if ((normalized as any).endDate)
        setEndDate(new Date((normalized as any).endDate));
    } catch (err) {
      console.error("Failed to load course", err);
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const allUsers = await usersApi.getAll();
      const normalized = Array.isArray(allUsers)
        ? allUsers.map((u: any) => ({ ...u, id: u.id || u._id }))
        : [];
      setUsers(normalized);
      setTutors(normalized.filter((u) => u.role === "tutor"));
    } catch (err) {
      console.error("Failed to load users", err);
    }

    // Load all courses for bulk transfer (separate try-catch to not fail silently)
    try {
      const courses = await coursesApi.getAll();
      const normalizedCourses = Array.isArray(courses)
        ? courses.map((c: any) => ({ ...c, id: c.id || c._id }))
        : [];
      // Filter out the current course so you can't copy students to itself
      const otherCourses = normalizedCourses.filter(
        (c) => c.id !== courseId && !(c as any).archived,
      );
      setAllCourses(otherCourses);
      // Set archived courses
      const archived = normalizedCourses.filter((c) => (c as any).archived);
      setArchivedCourses(archived);
    } catch (err) {
      console.error("Failed to load courses for transfer", err);
      setAllCourses([]);
      setArchivedCourses([]);
    }
  };

  // CREATE/SETUP Functions
  const handleApplyTemplate = async (templateType: string) => {
    try {
      await coursesApi.update(courseId, { template: templateType });
      setSelectedTemplate(templateType);
      toast({
        title: "Template Applied",
        description: `Applied ${templateType} template to course`,
      });
      onUpdate?.();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to apply template",
        variant: "destructive",
      });
    }
  };

  const handleSetDates = async () => {
    try {
      await coursesApi.update(courseId, {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      });
      toast({
        title: "Dates Updated",
        description: "Course dates have been set",
      });
      onUpdate?.();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to set dates",
        variant: "destructive",
      });
    }
  };

  // CONFIGURE Functions
  const handleUpdatePermissions = async () => {
    try {
      await coursesApi.update(courseId, {
        isActive: isPublished,
        isMandatory,
        enrollmentKey: allowSelfEnroll ? enrollmentKey : "",
      });
      toast({
        title: "Settings Updated",
        description: "Course configuration saved",
      });
      // Refresh all data
      await loadCourseData();
      await loadUsers();
      onUpdate?.();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to update",
        variant: "destructive",
      });
    }
  };

  const handleGenerateEnrollmentKey = () => {
    const key = Math.random().toString(36).substring(2, 10).toUpperCase();
    setEnrollmentKey(key);
  };

  // Handle CSV file upload for bulk enrollment
  const handleCsvUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      // Parse CSV - handle both comma and newline separated, skip headers
      const lines = text.split(/[\r\n]+/).filter(Boolean);
      const emails: string[] = [];

      for (const line of lines) {
        // Split by comma for CSV format
        const parts = line
          .split(",")
          .map((p) => p.trim().replace(/^["']|["']$/g, ""));
        for (const part of parts) {
          // Check if it looks like an email
          if (part.includes("@") && part.includes(".")) {
            emails.push(part.toLowerCase());
          }
        }
      }

      if (emails.length === 0) {
        toast({
          title: "No emails found",
          description: "CSV must contain valid email addresses",
          variant: "destructive",
        });
        return;
      }

      const currentEmails = course?.enrollEmails || [];
      const combinedEmails = Array.from(new Set([...currentEmails, ...emails]));

      await coursesApi.update(courseId, { enrollEmails: combinedEmails });
      toast({
        title: "CSV Import Complete",
        description: `Enrolled ${emails.length} user(s) from CSV`,
      });
      // Refresh all data
      await loadCourseData();
      await loadUsers();
      onUpdate?.();
    } catch (err: any) {
      toast({
        title: "CSV Import Error",
        description: err?.message || "Failed to process CSV",
        variant: "destructive",
      });
    }

    // Reset file input
    event.target.value = "";
  };

  // Handle bulk transfer students from another course
  const handleBulkCopyFromCourse = async () => {
    if (!transferFromCourse) {
      toast({
        title: "Error",
        description: "Select a course to transfer students from",
        variant: "destructive",
      });
      return;
    }

    try {
      const sourceCourse = allCourses.find((c) => c.id === transferFromCourse);
      if (!sourceCourse) {
        toast({
          title: "Error",
          description: "Source course not found",
          variant: "destructive",
        });
        return;
      }

      const sourceEmails = sourceCourse.enrollEmails || [];
      if (sourceEmails.length === 0) {
        toast({
          title: "No students",
          description: "Source course has no enrolled students",
          variant: "destructive",
        });
        return;
      }

      const currentEmails = course?.enrollEmails || [];
      const combinedEmails = Array.from(
        new Set([...currentEmails, ...sourceEmails]),
      );
      const newCount = combinedEmails.length - currentEmails.length;

      await coursesApi.update(courseId, { enrollEmails: combinedEmails });
      toast({
        title: "Students Transferred",
        description: `Transferred ${newCount} student(s) from "${sourceCourse.title}" (students remain enrolled in both courses)`,
      });
      setTransferFromCourse("");
      // Refresh all data
      await loadCourseData();
      await loadUsers();
      onUpdate?.();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to transfer students",
        variant: "destructive",
      });
    }
  };

  const handleAssignInstructor = async () => {
    if (!selectedInstructor) {
      toast({
        title: "Error",
        description: "Select an instructor",
        variant: "destructive",
      });
      return;
    }

    try {
      await coursesApi.update(courseId, { instructorId: selectedInstructor });
      const assignedTutor = tutors.find((t) => t.id === selectedInstructor);
      toast({
        title: "Instructor Assigned",
        description: `Successfully assigned ${assignedTutor?.fullName || "instructor"} to this course`,
      });
      // Refresh all data
      await loadCourseData();
      await loadUsers();
      onUpdate?.();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to assign",
        variant: "destructive",
      });
    }
  };

  // MAINTAIN Functions
  const handleArchiveCourse = async () => {
    if (
      !confirm(
        `Archive "${courseTitle}"? This will unpublish and hide the course.`,
      )
    )
      return;

    try {
      await coursesApi.update(courseId, { isActive: false, archived: true });
      toast({ title: "Archived", description: courseTitle });
      onOpenChange(false);
      onUpdate?.();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to archive",
        variant: "destructive",
      });
    }
  };

  // TROUBLESHOOT Functions
  const handleResetEnrollments = async () => {
    if (!confirm("Remove all enrollments? This cannot be undone.")) return;

    try {
      await coursesApi.update(courseId, { enrollEmails: [] });
      toast({
        title: "Reset Complete",
        description: "All enrollments removed",
      });
      loadCourseData();
      onUpdate?.();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to reset",
        variant: "destructive",
      });
    }
  };

  const handleFixAccessIssues = async () => {
    try {
      // Re-generate enrollment key and make course accessible
      const newKey = Math.random().toString(36).substring(2, 10).toUpperCase();
      await coursesApi.update(courseId, {
        enrollmentKey: newKey,
        isActive: true,
      });
      setEnrollmentKey(newKey);
      toast({
        title: "Access Fixed",
        description: `New enrollment key: ${newKey}`,
      });
      loadCourseData();
      onUpdate?.();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to fix access",
        variant: "destructive",
      });
    }
  };

  // MONITOR Functions
  const enrolledCount = course?.enrollEmails?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Manage Course: {courseTitle}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="setup">
              <Settings className="h-4 w-4 mr-2" />
              Setup
            </TabsTrigger>
            <TabsTrigger value="configure">
              <Shield className="h-4 w-4 mr-2" />
              Configure
            </TabsTrigger>
            <TabsTrigger value="populate">
              <Users className="h-4 w-4 mr-2" />
              Populate
            </TabsTrigger>
            <TabsTrigger value="monitor">
              <BarChart3 className="h-4 w-4 mr-2" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="maintain">
              <Copy className="h-4 w-4 mr-2" />
              Maintain
            </TabsTrigger>
            <TabsTrigger value="troubleshoot">
              <Wrench className="h-4 w-4 mr-2" />
              Troubleshoot
            </TabsTrigger>
          </TabsList>

          {/* CREATE/SETUP Tab */}
          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Setup & Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Apply Course Template</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Current: {selectedTemplate}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant={
                        selectedTemplate === "Standard" ? "default" : "outline"
                      }
                      onClick={() => handleApplyTemplate("Standard")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Standard
                    </Button>
                    <Button
                      variant={
                        selectedTemplate === "Workshop" ? "default" : "outline"
                      }
                      onClick={() => handleApplyTemplate("Workshop")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Workshop
                    </Button>
                    <Button
                      variant={
                        selectedTemplate === "Self-Paced"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => handleApplyTemplate("Self-Paced")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Self-Paced
                    </Button>
                    <Button
                      variant={
                        selectedTemplate === "Bootcamp" ? "default" : "outline"
                      }
                      onClick={() => handleApplyTemplate("Bootcamp")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Bootcamp
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Button onClick={handleSetDates} className="w-full">
                  Set Course Dates
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONFIGURE Tab */}
          <TabsContent value="configure" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Published</Label>
                    <p className="text-sm text-muted-foreground">
                      Course is visible and accessible
                    </p>
                  </div>
                  <Switch
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mandatory Course</Label>
                    <p className="text-sm text-muted-foreground">
                      All students auto-enrolled
                    </p>
                  </div>
                  <Switch
                    checked={isMandatory}
                    onCheckedChange={setIsMandatory}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Self-Enrollment</Label>
                    <p className="text-sm text-muted-foreground">
                      Students can enroll with key
                    </p>
                  </div>
                  <Switch
                    checked={allowSelfEnroll}
                    onCheckedChange={setAllowSelfEnroll}
                  />
                </div>

                {allowSelfEnroll && (
                  <div>
                    <Label>Enrollment Key</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={enrollmentKey}
                        onChange={(e) => setEnrollmentKey(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={handleGenerateEnrollmentKey}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <Button onClick={handleUpdatePermissions} className="w-full">
                  Save Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* POPULATE Tab */}
          <TabsContent value="populate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enroll Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Bulk Transfer from Another Course</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Transfer students from another course (students remain
                    enrolled in both courses)
                  </p>
                  {allCourses.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-2 border rounded">
                      No other courses available to transfer from
                    </p>
                  ) : (
                    <>
                      <Select
                        value={transferFromCourse}
                        onValueChange={setTransferFromCourse}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source course" />
                        </SelectTrigger>
                        <SelectContent>
                          {allCourses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.title} ({(c.enrollEmails || []).length}{" "}
                              students)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleBulkCopyFromCourse}
                        variant="outline"
                        className="w-full mt-2"
                        disabled={!transferFromCourse}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Bulk Transfer
                      </Button>
                    </>
                  )}
                </div>

                <div>
                  <Label>Import from CSV File</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload a CSV file with email addresses
                  </p>
                  <Input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCsvUpload}
                    className="cursor-pointer"
                  />
                </div>

                <div>
                  <Label>Assign Instructor</Label>
                  <Select
                    value={selectedInstructor}
                    onValueChange={setSelectedInstructor}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tutor" />
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
                    onClick={handleAssignInstructor}
                    className="w-full mt-2"
                  >
                    Assign Instructor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MONITOR Tab */}
          <TabsContent value="monitor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded">
                    <p className="text-sm text-muted-foreground">
                      Enrolled Students
                    </p>
                    <p className="text-3xl font-bold">{enrolledCount}</p>
                  </div>
                  <div className="p-4 border rounded">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={isPublished ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {isPublished ? "Published" : "Unpublished"}
                    </Badge>
                  </div>
                  <div className="p-4 border rounded">
                    <p className="text-sm text-muted-foreground">
                      Enrollment Type
                    </p>
                    <Badge
                      variant={isMandatory ? "destructive" : "outline"}
                      className="mt-2"
                    >
                      {isMandatory ? "Mandatory" : "Optional"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>Enrolled Users</Label>
                  <div className="border rounded p-2 max-h-60 overflow-y-auto mt-2">
                    {course?.enrollEmails?.map((email, idx) => (
                      <div
                        key={idx}
                        className="py-2 border-b last:border-0 text-sm"
                      >
                        {email}
                      </div>
                    ))}
                    {enrolledCount === 0 && (
                      <p className="text-sm text-muted-foreground p-4 text-center">
                        No enrollments yet
                      </p>
                    )}
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Enrollment Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MAINTAIN Tab */}
          <TabsContent value="maintain" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Maintenance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleArchiveCourse}
                  variant="destructive"
                  className="w-full"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive Course
                </Button>

                <div className="p-4 bg-muted rounded">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Archiving will unpublish the course
                    and hide it from all views. You can restore it later from
                    the admin panel.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TROUBLESHOOT Tab */}
          <TabsContent value="troubleshoot" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleFixAccessIssues}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Fix Access Issues (Regenerate Key)
                </Button>

                <Button
                  onClick={handleResetEnrollments}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset All Enrollments
                </Button>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200">
                  <p className="text-sm font-medium">⚠️ Destructive Actions</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The actions above are permanent and cannot be undone. Use
                    with caution.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Debug Information</Label>
                  <div className="p-3 bg-muted rounded text-xs font-mono">
                    <p>Course ID: {courseId}</p>
                    <p>Enrollments: {enrolledCount}</p>
                    <p>Published: {isPublished ? "Yes" : "No"}</p>
                    <p>Enrollment Key: {enrollmentKey || "Not set"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Archived Courses</Label>
                  {archivedCourses.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-3 border rounded">
                      No archived courses
                    </p>
                  ) : (
                    <div className="border rounded max-h-48 overflow-y-auto">
                      {archivedCourses.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-3 border-b last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium">{c.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.department}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await coursesApi.update(c.id, {
                                  archived: false,
                                  isActive: true,
                                });
                                toast({
                                  title: "Course Restored",
                                  description: `"${c.title}" has been restored`,
                                });
                                await loadUsers();
                                onUpdate?.();
                              } catch (err: any) {
                                toast({
                                  title: "Error",
                                  description:
                                    err?.message || "Failed to restore course",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Restore
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
