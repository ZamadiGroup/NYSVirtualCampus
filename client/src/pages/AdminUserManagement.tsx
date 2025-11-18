import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button as ButtonUI } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { Users, Trash2, Lock, Edit2, Plus, Shield, CheckCircle, XCircle, User, BookOpen, GraduationCap } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'student' | 'tutor' | 'admin';
  department?: string;
  createdAt: string;
  isGraduated?: boolean;
  permissions?: {
    canCreateCourses?: boolean;
    canEditCourses?: boolean;
    canDeleteCourses?: boolean;
    canGradeAssignments?: boolean;
    canViewAllUsers?: boolean;
    canManageEnrollments?: boolean;
  };
}

export default function AdminUserManagement() {
  const { toast } = useToast();
  const user = getCurrentUser();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [userPermissions, setUserPermissions] = useState({
    canCreateCourses: false,
    canEditCourses: false,
    canDeleteCourses: false,
    canGradeAssignments: false,
    canViewAllUsers: false,
    canManageEnrollments: false,
  });

  const [newUser, setNewUser] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
  });

  const [editUserData, setEditUserData] = useState({
    fullName: '',
    username: '',
    email: '',
    role: 'student',
    department: '',
  });

  const itemsPerPage = 10;

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const query = new URLSearchParams();
      query.append('page', page.toString());
      query.append('limit', itemsPerPage.toString());
      if (roleFilter !== 'all') query.append('role', roleFilter);

      const res = await fetch(`/api/admin/users?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch users');

      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete user');

      toast({ title: 'Success', description: `${selectedUser.fullName} has been deleted` });
      setShowDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      toast({ title: 'Error', description: 'Password is required', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser._id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) throw new Error('Failed to reset password');

      toast({ title: 'Success', description: 'Password reset successfully' });
      setShowResetPasswordDialog(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.password || !newUser.username) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }

    if (newUser.password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) throw new Error('Failed to create user');

      toast({ title: 'Success', description: 'User created successfully' });
      setShowAddUserDialog(false);
      setNewUser({
        fullName: '',
        username: '',
        email: '',
        password: '',
        role: 'student',
        department: '',
      });
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    if (!editUserData.fullName || !editUserData.email || !editUserData.username) {
      toast({ title: 'Error', description: 'Name, email, and username are required', variant: 'destructive' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editUserData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      toast({ title: 'Success', description: 'User updated successfully' });
      setShowEditUserDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions: userPermissions }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update permissions');
      }

      toast({ title: 'Success', description: 'Permissions updated successfully' });
      setShowPermissionsDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Get default permissions based on role
  const getDefaultPermissions = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          canCreateCourses: true,
          canEditCourses: true,
          canDeleteCourses: true,
          canGradeAssignments: true,
          canViewAllUsers: true,
          canManageEnrollments: true,
        };
      case 'tutor':
        return {
          canCreateCourses: true,
          canEditCourses: true,
          canDeleteCourses: false,
          canGradeAssignments: true,
          canViewAllUsers: false,
          canManageEnrollments: true,
        };
      case 'student':
      default:
        return {
          canCreateCourses: false,
          canEditCourses: false,
          canDeleteCourses: false,
          canGradeAssignments: false,
          canViewAllUsers: false,
          canManageEnrollments: false,
        };
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage users, roles, and permissions</p>
        </div>
        <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
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
                <Label htmlFor="new-fullname">Full Name</Label>
                <Input
                  id="new-fullname"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="new-username">Username</Label>
                <Input
                  id="new-username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="johndoe"
                />
              </div>
              <div>
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="new-password">Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label htmlFor="new-role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                  <SelectTrigger id="new-role">
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
                <Label htmlFor="new-department">Department</Label>
                <Input
                  id="new-department"
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  placeholder="Technology"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>
                  Create User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Total users: {total}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
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

          {/* Users Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">{u.fullName}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            u.role === 'admin'
                              ? 'destructive'
                              : u.role === 'tutor'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{u.department || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(u.permissions?.canCreateCourses || getDefaultPermissions(u.role).canCreateCourses) && (
                            <Badge variant="outline" className="text-xs">Create</Badge>
                          )}
                          {(u.permissions?.canGradeAssignments || getDefaultPermissions(u.role).canGradeAssignments) && (
                            <Badge variant="outline" className="text-xs">Grade</Badge>
                          )}
                          {u.role === 'admin' && (
                            <Badge variant="default" className="text-xs">Full</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(u);
                              const defaultPerms = getDefaultPermissions(u.role);
                              setUserPermissions({
                                canCreateCourses: u.permissions?.canCreateCourses ?? defaultPerms.canCreateCourses,
                                canEditCourses: u.permissions?.canEditCourses ?? defaultPerms.canEditCourses,
                                canDeleteCourses: u.permissions?.canDeleteCourses ?? defaultPerms.canDeleteCourses,
                                canGradeAssignments: u.permissions?.canGradeAssignments ?? defaultPerms.canGradeAssignments,
                                canViewAllUsers: u.permissions?.canViewAllUsers ?? defaultPerms.canViewAllUsers,
                                canManageEnrollments: u.permissions?.canManageEnrollments ?? defaultPerms.canManageEnrollments,
                              });
                              setShowPermissionsDialog(true);
                            }}
                            title="Manage permissions"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(u);
                              setEditUserData({
                                fullName: u.fullName,
                                username: u.username,
                                email: u.email,
                                role: u.role,
                                department: u.department || '',
                              });
                              setShowEditUserDialog(true);
                            }}
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {u.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(u);
                                setNewPassword('');
                                setShowResetPasswordDialog(true);
                              }}
                              title="Reset password"
                            >
                              <Lock className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedUser(u);
                              setShowDeleteDialog(true);
                            }}
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => (p < totalPages ? p + 1 : p))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.fullName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
            All associated data (enrollments, submissions, grades) will be deleted.
          </div>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Set a new password for {selectedUser?.fullName}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <Input
                id="reset-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>
              Reset Password
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-fullname">Full Name</Label>
              <Input
                id="edit-fullname"
                value={editUserData.fullName}
                onChange={(e) => setEditUserData({...editUserData, fullName: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editUserData.username}
                onChange={(e) => setEditUserData({...editUserData, username: e.target.value})}
                placeholder="johndoe"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editUserData.role} onValueChange={(value) => setEditUserData({...editUserData, role: value})}>
                <SelectTrigger id="edit-role">
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
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                value={editUserData.department}
                onChange={(e) => setEditUserData({...editUserData, department: e.target.value})}
                placeholder="Technology"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUser}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Management Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Manage Permissions - {selectedUser?.fullName}
            </DialogTitle>
            <DialogDescription>
              Configure what actions this {selectedUser?.role} can perform in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Role-based defaults info */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Role:</strong> {selectedUser?.role?.toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                These permissions override the default role permissions.
              </p>
            </div>

            {/* Course Management */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Course Management
              </h4>
              <div className="space-y-2 pl-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={userPermissions.canCreateCourses}
                    onChange={(e) => setUserPermissions({...userPermissions, canCreateCourses: e.target.checked})}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Create Courses</p>
                    <p className="text-xs text-muted-foreground">Allow user to create new courses</p>
                  </div>
                  {userPermissions.canCreateCourses ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={userPermissions.canEditCourses}
                    onChange={(e) => setUserPermissions({...userPermissions, canEditCourses: e.target.checked})}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Edit Courses</p>
                    <p className="text-xs text-muted-foreground">Allow user to edit course details</p>
                  </div>
                  {userPermissions.canEditCourses ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={userPermissions.canDeleteCourses}
                    onChange={(e) => setUserPermissions({...userPermissions, canDeleteCourses: e.target.checked})}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Delete Courses</p>
                    <p className="text-xs text-muted-foreground">Allow user to delete courses</p>
                  </div>
                  {userPermissions.canDeleteCourses ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                </label>
              </div>
            </div>

            {/* Assessment & Grading */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Assessment & Grading
              </h4>
              <div className="space-y-2 pl-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={userPermissions.canGradeAssignments}
                    onChange={(e) => setUserPermissions({...userPermissions, canGradeAssignments: e.target.checked})}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Grade Assignments</p>
                    <p className="text-xs text-muted-foreground">Allow user to grade student submissions</p>
                  </div>
                  {userPermissions.canGradeAssignments ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                </label>
              </div>
            </div>

            {/* User & Enrollment Management */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                User & Enrollment Management
              </h4>
              <div className="space-y-2 pl-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={userPermissions.canViewAllUsers}
                    onChange={(e) => setUserPermissions({...userPermissions, canViewAllUsers: e.target.checked})}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">View All Users</p>
                    <p className="text-xs text-muted-foreground">Allow user to view all system users</p>
                  </div>
                  {userPermissions.canViewAllUsers ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={userPermissions.canManageEnrollments}
                    onChange={(e) => setUserPermissions({...userPermissions, canManageEnrollments: e.target.checked})}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Manage Enrollments</p>
                    <p className="text-xs text-muted-foreground">Allow user to enroll/unenroll students</p>
                  </div>
                  {userPermissions.canManageEnrollments ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePermissions}>
                <Shield className="w-4 h-4 mr-2" />
                Update Permissions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
