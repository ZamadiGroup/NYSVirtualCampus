import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usersApi, type ApiUser } from "@/lib/api";
import { Users, UserPlus, Search, Filter } from "lucide-react";

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ApiUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
    department: "",
  });

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await usersApi.getAll().catch(() => []);
      const normalized = Array.isArray(allUsers)
        ? allUsers.map((u: any) => ({
            ...u,
            id: (u as any).id || (u as any)._id,
          }))
        : [];
      setUsers(normalized);
    } catch (e) {
      console.warn("Failed to load users", e);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter and search users
  useEffect(() => {
    let filtered = users;

    // Filter by role
    if (selectedRole !== "all") {
      filtered = filtered.filter((u) => u.role === selectedRole);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.username?.toLowerCase().includes(term),
      );
    }

    setFilteredUsers(filtered);
  }, [users, selectedRole, searchTerm]);

  // Calculate stats by role
  const stats = useMemo(() => {
    const allStudents = users.filter((u) => u.role === "student");
    return {
      total: users.length,
      students: allStudents.filter((u) => !u.isGraduated).length,
      graduated: allStudents.filter((u) => u.isGraduated).length,
      tutors: users.filter((u) => u.role === "tutor").length,
      admins: users.filter((u) => u.role === "admin").length,
    };
  }, [users]);

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.password) {
      toast({
        title: "Missing fields",
        description: "Name, email, and password are required",
        variant: "destructive",
      });
      return;
    }
    try {
      setSaving(true);
      await usersApi.create(newUser);
      toast({ title: "User created", description: newUser.fullName });
      setNewUser({
        fullName: "",
        email: "",
        password: "",
        role: "student",
        department: "",
      });
      setIsAddUserOpen(false);
      loadUsers();
    } catch (err: any) {
      toast({
        title: "Create failed",
        description: err?.message || "Could not create user",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGraduateStudent = async (userId: string, fullName: string) => {
    try {
      await usersApi.graduate(userId);
      toast({ title: "Student graduated", description: fullName });
      loadUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to graduate student",
        variant: "destructive",
      });
    }
  };

  const renderUserCard = (user: ApiUser) => (
    <div
      key={user.id}
      className="p-4 flex items-center justify-between hover:bg-muted/50"
    >
      <div className="flex items-center gap-3 flex-1">
        <Avatar className="h-10 w-10">
          <AvatarFallback
            className={
              user.role === "admin"
                ? "bg-red-500 text-white"
                : user.role === "tutor"
                  ? "bg-purple-500 text-white"
                  : "bg-green-500 text-white"
            }
          >
            {user.fullName
              ? user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
              : user.username?.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{user.fullName || user.username}</p>
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
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {user.department && (
            <p className="text-xs text-muted-foreground">{user.department}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {user.role === "student" && user.isGraduated && (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          >
            Graduated
          </Badge>
        )}
        {user.role === "student" && !user.isGraduated && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleGraduateStudent(user.id, user.fullName)}
          >
            Graduate
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage all users in the system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-2xl font-bold">{stats.students}</p>
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
                  Tutors
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">
                  Admins
                </p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
              <Users className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-filter">Filter by Role</Label>
              <div className="flex gap-2 items-end">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="tutor">Tutors</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRole("all");
                    setSearchTerm("");
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List with Tabs by Role */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Users ({filteredUsers.length})
          </TabsTrigger>
          <TabsTrigger value="students">
            Students ({stats.students})
          </TabsTrigger>
          <TabsTrigger value="graduated">
            Graduated ({stats.graduated})
          </TabsTrigger>
          <TabsTrigger value="tutors">Tutors ({stats.tutors})</TabsTrigger>
          <TabsTrigger value="admins">Admins ({stats.admins})</TabsTrigger>
        </TabsList>

        {/* All Users Tab */}
        <TabsContent value="all" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              All Users ({filteredUsers.length})
            </h2>
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
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={newUser.fullName}
                      onChange={(e) =>
                        setNewUser({ ...newUser, fullName: e.target.value })
                      }
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, role: value })
                      }
                    >
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
                      onChange={(e) =>
                        setNewUser({ ...newUser, department: e.target.value })
                      }
                      placeholder="Technology"
                    />
                  </div>
                  <Button
                    onClick={handleAddUser}
                    className="w-full"
                    disabled={saving}
                  >
                    Create User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                  </div>
                ) : (
                  filteredUsers.map(renderUserCard)
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab (non-graduated only) */}
        <TabsContent value="students" className="space-y-4">
          <h2 className="text-xl font-semibold">
            Active Students ({stats.students})
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredUsers
                  .filter((u) => u.role === "student" && !u.isGraduated)
                  .map(renderUserCard)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graduated Students Tab */}
        <TabsContent value="graduated" className="space-y-4">
          <h2 className="text-xl font-semibold">
            Graduated Students ({stats.graduated})
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredUsers.filter(
                  (u) => u.role === "student" && u.isGraduated,
                ).length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No graduated students yet</p>
                  </div>
                ) : (
                  filteredUsers
                    .filter((u) => u.role === "student" && u.isGraduated)
                    .map(renderUserCard)
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tutors Tab */}
        <TabsContent value="tutors" className="space-y-4">
          <h2 className="text-xl font-semibold">Tutors ({stats.tutors})</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredUsers
                  .filter((u) => u.role === "tutor")
                  .map(renderUserCard)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins Tab */}
        <TabsContent value="admins" className="space-y-4">
          <h2 className="text-xl font-semibold">Admins ({stats.admins})</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredUsers
                  .filter((u) => u.role === "admin")
                  .map(renderUserCard)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
