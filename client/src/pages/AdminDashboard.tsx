
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, GraduationCap, Settings, Trash2, Edit2, UserPlus, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";


// Backend integration functions
interface User {
  id?: string;
  _id?: string;
  fullName: string;
  username?: string;
  email: string;
  role: 'student' | 'tutor' | 'admin';
  department?: string;
}

interface Course {
  id?: string;
  _id?: string;
  title: string;
  department?: string;
  instructorId?: string | { _id?: string; fullName?: string };
  enrolledCount?: number;
  enrollEmails?: string[];
  description?: string;
}

const fetchUsers = async (): Promise<User[]> => {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/users', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.status === 401) {
    // Token is invalid or expired - clear it and redirect to login
    localStorage.removeItem('token');
    window.location.href = '/auth';
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) throw new Error('Failed to fetch users');
  const data = await res.json();
  // Support both array and {users:[]} response
  return Array.isArray(data) ? data : (data.users || []);
};

const fetchCourses = async (): Promise<Course[]> => {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/courses', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.status === 401) {
    // Token is invalid or expired - clear it and redirect to login
    localStorage.removeItem('token');
    window.location.href = '/auth';
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) throw new Error('Failed to fetch courses');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.courses || data);
};

const createUser = async (user: User) => {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error('Failed to create user');
  return await res.json();
};

const deleteUser = async (userId: string) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return await res.json();
};

const updateUser = async (userId: string, updates: Partial<User>) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update user');
  return await res.json();
};

const createCourse = async (course: Course) => {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/courses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(course),
  });
  if (!res.ok) throw new Error('Failed to create course');
  return await res.json();
};

const deleteCourse = async (courseId: string) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/courses/${courseId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete course');
  return await res.json();
};

const assignTutor = async (courseId: string, tutorId: string) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/courses/${courseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ instructorId: tutorId }),
  });
  if (!res.ok) throw new Error('Failed to assign tutor');
  return await res.json();
};

const enrollStudent = async (courseId: string, studentEmail: string) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/courses/${courseId}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ enrollEmails: [studentEmail] }),
  });
  if (!res.ok) throw new Error('Failed to enroll student');
  return await res.json();
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    department: '',
    instructorId: '',
    description: '',
  });
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedStudentEmail, setSelectedStudentEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isAssignTutorOpen, setIsAssignTutorOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'student',
    department: ''
  });
  const [editUser, setEditUser] = useState({
    fullName: '',
    username: '',
    email: '',
    role: 'student',
    department: ''
  });
  const [userFilter, setUserFilter] = useState({
    role: 'all',
    search: ''
  });

  // Helper function to safely get fullName string
  const getFullName = (nameField: any): string => {
    if (typeof nameField === 'string') return nameField;
    if (typeof nameField === 'object' && nameField?.fullName) return nameField.fullName;
    return 'Unknown';
  };

  useEffect(() => {
    (async () => {
      setUsers(await fetchUsers());
      setCourses(await fetchCourses());
    })();
  }, []);

  const stats = {
    totalUsers: users.length,
    students: users.filter(u => u.role === 'student').length,
    tutors: users.filter(u => u.role === 'tutor').length,
    activeCourses: courses.length
  };

  // Filter users based on role and search
  const filteredUsers = users.filter(user => {
    const matchesRole = userFilter.role === 'all' || user.role === userFilter.role;
    const searchLower = userFilter.search.toLowerCase();
    const matchesSearch = !userFilter.search || 
      getFullName(user.fullName).toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.username && user.username.toLowerCase().includes(searchLower)) ||
      (user.department && user.department.toLowerCase().includes(searchLower));
    return matchesRole && matchesSearch;
  });

  const handleAddUser = async () => {
    try {
      const user: User = {
        ...newUser,
        id: Date.now().toString(),
        role: newUser.role as 'student' | 'tutor' | 'admin',
      };
      await createUser(user);
      setUsers(await fetchUsers());
      setNewUser({ fullName: '', username: '', email: '', password: '', role: 'student', department: '' });
      setIsAddUserOpen(false);
      toast({
        title: "User Created",
        description: `${newUser.fullName} has been added successfully.`,
      });
    } catch (err) {
      toast({
        title: "Creation Failed",
        description: "Failed to create user. Please check the information and try again.",
        variant: "destructive",
      });
    }
  };


  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        setUsers(await fetchUsers());
        toast({
          title: "User Deleted",
          description: "User has been removed successfully.",
        });
      } catch (err) {
        toast({
          title: "Deletion Failed",
          description: "Failed to delete user. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      fullName: getFullName(user.fullName),
      username: user.username || '',
      email: user.email,
      role: user.role,
      department: user.department || ''
    });
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await updateUser(String(selectedUser.id || selectedUser._id), {
        ...editUser,
        role: editUser.role as 'student' | 'tutor' | 'admin'
      });
      setUsers(await fetchUsers());
      setIsEditUserOpen(false);
      setSelectedUser(null);
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
    } catch (err) {
      toast({
        title: "Update Failed",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    }
  };


  const handleAssignTutor = async (courseId: string, tutorId: string) => {
    try {
      await assignTutor(courseId, tutorId);
      setCourses(await fetchCourses());
      setIsAssignTutorOpen(false);
      toast({
        title: "Tutor Assigned",
        description: "Tutor has been assigned to the course successfully.",
      });
    } catch (err) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign tutor. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleCreateCourse = async () => {
    try {
      await createCourse(newCourse);
      setCourses(await fetchCourses());
      setNewCourse({ title: '', department: '', instructorId: '', description: '' });
      setIsAddCourseOpen(false);
      toast({
        title: "Course Created",
        description: `${newCourse.title} has been created successfully.`,
      });
    } catch (err) {
      toast({
        title: "Creation Failed",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse(courseId);
        setCourses(await fetchCourses());
        toast({
          title: "Course Deleted",
          description: "Course has been removed successfully.",
        });
      } catch (err) {
        toast({
          title: "Deletion Failed",
          description: "Failed to delete course. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedCourseId || !selectedStudentEmail) {
      toast({
        title: "Missing Information",
        description: "Please select a course and enter a student email.",
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await enrollStudent(selectedCourseId, selectedStudentEmail);
      
      // Refresh courses to show updated enrollment count
      const updatedCourses = await fetchCourses();
      setCourses(updatedCourses);
      
      setSelectedCourseId('');
      setSelectedStudentEmail('');
      setIsEnrollDialogOpen(false);
      
      toast({
        title: "Student Enrolled Successfully",
        description: `${selectedStudentEmail} has been enrolled in the course.`,
      });
    } catch (err) {
      toast({
        title: "Enrollment Failed",
        description: err instanceof Error ? err.message : "Failed to enroll student. Please check the email and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Complete system management and control</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Students</p>
                <p className="text-2xl font-bold">{stats.students}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tutors</p>
                <p className="text-2xl font-bold">{stats.tutors}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Courses</p>
                <p className="text-2xl font-bold">{stats.activeCourses}</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="courses">Course Management</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollment Management</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <h2 className="text-xl font-semibold">User Management</h2>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account with their details and assign a role.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Username</Label>
                    <Input
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      placeholder="johndoe"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="tutor">Tutor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      placeholder="Technology"
                    />
                  </div>
                  <Button onClick={handleAddUser} className="w-full">
                    Create User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, username, or department..."
                value={userFilter.search}
                onChange={(e) => setUserFilter({...userFilter, search: e.target.value})}
              />
            </div>
            <Select value={userFilter.role} onValueChange={(value) => setUserFilter({...userFilter, role: value})}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="tutor">Tutors</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'}
                {userFilter.role !== 'all' && ` (${userFilter.role}s)`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No users found matching your criteria.
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id || user._id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{getFullName(user.fullName)}</p>
                          <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'tutor' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                        {user.department && <p className="text-xs text-muted-foreground">{user.department}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(String(user.id || user._id || ''))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit User Dialog */}
          <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user information and role assignments.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={editUser.fullName}
                    onChange={(e) => setEditUser({...editUser, fullName: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input
                    value={editUser.username}
                    onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                    placeholder="johndoe"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editUser.email}
                    onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={editUser.role} onValueChange={(value) => setEditUser({...editUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="tutor">Tutor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Department</Label>
                  <Input
                    value={editUser.department}
                    onChange={(e) => setEditUser({...editUser, department: e.target.value})}
                    placeholder="Technology"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateUser} className="flex-1">
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditUserOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">All Courses</h2>
            <Dialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Course
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Course</DialogTitle>
                  <DialogDescription>
                    Create a new course with title, department, and instructor assignment.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                      placeholder="Course Title"
                    />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input
                      value={newCourse.department}
                      onChange={(e) => setNewCourse({ ...newCourse, department: e.target.value })}
                      placeholder="Department"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      placeholder="Description"
                    />
                  </div>
                  <div>
                    <Label>Instructor</Label>
                    <Select value={newCourse.instructorId || ''} onValueChange={(value: string) => setNewCourse({ ...newCourse, instructorId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Tutor" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => u.role === 'tutor').map((tutor) => (
                          tutor.id || tutor._id ? (
                            <SelectItem key={tutor.id || tutor._id} value={String(tutor.id || tutor._id)}>
                              {getFullName(tutor.fullName)}
                            </SelectItem>
                          ) : null
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateCourse} className="w-full">
                    Create Course
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {courses.map((course) => (
              <Card key={course.id || course._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <strong>{course.enrolledCount || 0}</strong> students
                          </span>
                          <Badge variant="outline">{course.department}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Instructor: {
                            typeof course.instructorId === 'object' && course.instructorId?.fullName 
                              ? getFullName(course.instructorId.fullName)
                              : typeof course.instructorId === 'string' 
                                ? getFullName(users.find(u => String(u._id || u.id) === course.instructorId)?.fullName) || 'Not assigned'
                                : 'Not assigned'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isAssignTutorOpen} onOpenChange={setIsAssignTutorOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedCourse(course)}>
                            Assign Tutor
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Tutor to {course.title}</DialogTitle>
                            <DialogDescription>
                              Select a tutor to assign as the instructor for this course.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Select Tutor</Label>
                              <Select onValueChange={(value: string) => handleAssignTutor(String(course.id || course._id || ''), value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a tutor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {users.filter(u => u.role === 'tutor').map((tutor) => (
                                    tutor.id || tutor._id ? (
                                      <SelectItem key={tutor.id || tutor._id} value={String(tutor.id || tutor._id)}>
                                        {getFullName(tutor.fullName)}
                                      </SelectItem>
                                    ) : null
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCourse(String(course.id || course._id || ''))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Enrollments Tab */}
        <TabsContent value="enrollments" className="space-y-4">
          <Alert>
            <AlertDescription>
              Manage student enrollments across all courses. Enroll students by selecting a course and student below.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Enroll Students in Courses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Select Course</Label>
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem
                          key={String(course.id || course._id || '')}
                          value={String(course.id || course._id || '')}
                        >
                          {course.title} ({course.enrolledCount || 0} students)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Select Student</Label>
                  <Select value={selectedStudentEmail} onValueChange={setSelectedStudentEmail}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.role === 'student').map((student) => (
                        <SelectItem
                          key={String(student.id || student._id || '')}
                          value={student.email}
                        >
                          {getFullName(student.fullName)} - {student.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Or type email manually below
                  </p>
                  <Input
                    value={selectedStudentEmail}
                    onChange={(e) => setSelectedStudentEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEnrollStudent} disabled={!selectedCourseId || !selectedStudentEmail}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enroll Student
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedCourseId('');
                    setSelectedStudentEmail('');
                  }}
                >
                  Clear
                </Button>
              </div>
              
              {/* Show selected course details */}
              {selectedCourseId && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Selected Course Details</h4>
                  {(() => {
                    const course = courses.find(c => String(c.id || c._id) === selectedCourseId);
                    if (!course) return <p className="text-sm text-muted-foreground">Course not found</p>;
                    return (
                      <div className="text-sm space-y-1">
                        <p><strong>Title:</strong> {course.title}</p>
                        <p><strong>Department:</strong> {course.department}</p>
                        <p><strong>Current Enrollment:</strong> {course.enrolledCount || 0} students</p>
                        <p><strong>Instructor:</strong> {
                          typeof course.instructorId === 'object' && course.instructorId?.fullName 
                            ? getFullName(course.instructorId.fullName)
                            : 'Not assigned'
                        }</p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
