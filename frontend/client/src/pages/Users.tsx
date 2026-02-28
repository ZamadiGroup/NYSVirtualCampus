import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { usersApi, type ApiUser } from "@/lib/api";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Upload,
  FileSpreadsheet,
  X,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ── types ────────────────────────────────────────────────────────────────────

interface ParsedUser {
  fullName: string;
  email: string;
  role: string;
  department: string;
  generatedPassword: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "NYS@";
  for (let i = 0; i < 6; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

function normaliseHeader(h: string): string {
  return h.toLowerCase().replace(/[\s_-]/g, "");
}

function mapHeader(h: string): string | null {
  const n = normaliseHeader(h);
  if (["name", "fullname", "full name", "fullname"].includes(n) || n.includes("name")) return "fullName";
  if (n === "email" || n.includes("email")) return "email";
  if (n === "role" || n.includes("role")) return "role";
  if (n === "department" || n === "dept" || n.includes("dept") || n.includes("department")) return "department";
  return null;
}

function parseSheet(data: any[][]): ParsedUser[] {
  if (data.length < 2) return [];
  const headers = data[0].map((h: any) => String(h ?? ""));
  const fieldMap: Record<number, string> = {};
  headers.forEach((h, i) => {
    const mapped = mapHeader(h);
    if (mapped) fieldMap[i] = mapped;
  });

  const results: ParsedUser[] = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const obj: any = { role: "student", department: "" };
    Object.entries(fieldMap).forEach(([colStr, field]) => {
      const val = String(row[Number(colStr)] ?? "").trim();
      if (val) obj[field] = val;
    });
    if (!obj.fullName || !obj.email) continue;
    results.push({ ...obj, generatedPassword: generatePassword() });
  }
  return results;
}

function downloadCredentials(users: ParsedUser[]) {
  const ws = XLSX.utils.aoa_to_sheet([
    ["Full Name", "Email", "Role", "Department", "Temporary Password"],
    ...users.map((u) => [u.fullName, u.email, u.role, u.department, u.generatedPassword]),
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Credentials");
  XLSX.writeFile(wb, "nys_user_credentials.xlsx");
}

// ── component ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ApiUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  // single-add dialog
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
    department: "",
  });

  // bulk-add dialog
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [parseError, setParseError] = useState("");
  const [importProgress, setImportProgress] = useState<{ done: number; total: number; errors: string[] } | null>(null);
  const [importedUsers, setImportedUsers] = useState<ParsedUser[]>([]);

  // ── data loading ────────────────────────────────────────────────────────────

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await usersApi.getAll().catch(() => []);
      const normalized = Array.isArray(allUsers)
        ? allUsers.map((u: any) => ({ ...u, id: u.id || u._id }))
        : [];
      setUsers(normalized);
    } catch {
      /* silently ignore */
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    let filtered = users;
    if (selectedRole !== "all") filtered = filtered.filter((u) => u.role === selectedRole);
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

  // ── single-add ──────────────────────────────────────────────────────────────

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.password) {
      toast({ title: "Missing fields", description: "Name, email, and password are required", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      await usersApi.create(newUser);
      toast({ title: "User created", description: newUser.fullName });
      setNewUser({ fullName: "", email: "", password: "", role: "student", department: "" });
      setIsAddUserOpen(false);
      loadUsers();
    } catch (err: any) {
      toast({ title: "Create failed", description: err?.message || "Could not create user", variant: "destructive" });
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
      toast({ title: "Error", description: err?.message || "Failed to graduate student", variant: "destructive" });
    }
  };

  // ── bulk-add file handling ──────────────────────────────────────────────────

  const processFile = (file: File) => {
    setParseError("");
    setParsedUsers([]);
    setImportProgress(null);
    setImportedUsers([]);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
      setParseError("Please upload a .csv, .xlsx, or .xls file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const parsed = parseSheet(rows);
        if (parsed.length === 0) {
          setParseError("No valid rows found. Make sure your file has headers: Full Name, Email, Role, Department.");
        } else {
          setParsedUsers(parsed);
        }
      } catch {
        setParseError("Could not read file. Please check it is a valid CSV or Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleImport = async () => {
    if (!parsedUsers.length) return;
    setSaving(true);
    const errors: string[] = [];
    setImportProgress({ done: 0, total: parsedUsers.length, errors: [] });

    for (let i = 0; i < parsedUsers.length; i++) {
      const u = parsedUsers[i];
      try {
        await usersApi.create({
          fullName: u.fullName,
          email: u.email,
          password: u.generatedPassword,
          role: u.role,
          department: u.department,
          username: u.email.split("@")[0],
        });
      } catch (err: any) {
        errors.push(`${u.email}: ${err?.message || "Failed"}`);
      }
      setImportProgress({ done: i + 1, total: parsedUsers.length, errors: [...errors] });
    }

    setSaving(false);
    const succeeded = parsedUsers.length - errors.length;
    setImportedUsers(succeeded > 0 ? parsedUsers.filter((_, i) => !errors.some((e) => e.startsWith(parsedUsers[i].email))) : []);
    toast({
      title: "Import complete",
      description: `${succeeded} user${succeeded !== 1 ? "s" : ""} created${errors.length ? `, ${errors.length} failed` : ""}`,
      variant: errors.length > 0 ? "destructive" : "default",
    });
    if (succeeded > 0) loadUsers();
  };

  const resetBulkDialog = () => {
    setParsedUsers([]);
    setParseError("");
    setImportProgress(null);
    setImportedUsers([]);
    setSaving(false);
  };

  // ── user card ───────────────────────────────────────────────────────────────

  const renderUserCard = (user: ApiUser) => (
    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
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
              ? user.fullName.split(" ").map((n) => n[0]).join("")
              : user.username?.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{user.fullName || user.username}</p>
            <Badge variant={user.role === "admin" ? "destructive" : user.role === "tutor" ? "default" : "secondary"}>
              {user.role}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {user.department && <p className="text-xs text-muted-foreground">{user.department}</p>}
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {user.role === "student" && user.isGraduated && (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Graduated
          </Badge>
        )}
        {user.role === "student" && !user.isGraduated && (
          <Button size="sm" variant="outline" onClick={() => handleGraduateStudent(user.id, user.fullName)}>
            Graduate
          </Button>
        )}
      </div>
    </div>
  );

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">Manage all users in the system</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.total, color: "text-blue-500" },
          { label: "Students", value: stats.students, color: "text-green-500" },
          { label: "Tutors", value: stats.tutors, color: "text-purple-500" },
          { label: "Admins", value: stats.admins, color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
                <Users className={`h-8 w-8 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <Card>
        <CardHeader><CardTitle>Search & Filter</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or username…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Filter by Role</Label>
              <div className="flex gap-2 items-end">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="tutor">Tutors</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => { setSelectedRole("all"); setSearchTerm(""); }}>
                  <Filter className="h-4 w-4 mr-2" />Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Users ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="students">Students ({stats.students})</TabsTrigger>
          <TabsTrigger value="graduated">Graduated ({stats.graduated})</TabsTrigger>
          <TabsTrigger value="tutors">Tutors ({stats.tutors})</TabsTrigger>
          <TabsTrigger value="admins">Admins ({stats.admins})</TabsTrigger>
        </TabsList>

        {/* All Users Tab */}
        <TabsContent value="all" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">All Users ({filteredUsers.length})</h2>
            <div className="flex gap-2">

              {/* ── Bulk Import Dialog ─────────────────────────── */}
              <Dialog
                open={isBulkAddOpen}
                onOpenChange={(open) => { setIsBulkAddOpen(open); if (!open) resetBulkDialog(); }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Import Users
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Import Users from File</DialogTitle>
                  </DialogHeader>

                  {/* Step 1 – upload */}
                  {!parsedUsers.length && !importProgress && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Upload a <strong>.csv</strong> or <strong>.xlsx</strong> file. Passwords are
                        auto-generated — you can download them after import.
                      </p>

                      {/* Template download */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={() => {
                          const ws = XLSX.utils.aoa_to_sheet([
                            ["Full Name", "Email", "Role", "Department"],
                            ["Jane Doe", "jane@nys.go.ke", "student", "Technology"],
                            ["John Smith", "john@nys.go.ke", "tutor", "Engineering"],
                          ]);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, "Users");
                          XLSX.writeFile(wb, "nys_users_template.xlsx");
                        }}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Download template
                      </Button>

                      {/* Drop zone */}
                      <div
                        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/60"
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                        <p className="font-medium">Drop your file here</p>
                        <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-2">Supports .csv, .xlsx, .xls</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </div>

                      {parseError && (
                        <div className="flex items-start gap-2 text-destructive text-sm">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {parseError}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-medium">Expected columns (any order):</p>
                        <p>• <strong>Full Name</strong> (required)</p>
                        <p>• <strong>Email</strong> (required)</p>
                        <p>• <strong>Role</strong> — student / tutor / admin (defaults to student)</p>
                        <p>• <strong>Department</strong> (optional)</p>
                      </div>
                    </div>
                  )}

                  {/* Step 2 – preview */}
                  {parsedUsers.length > 0 && !importProgress && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {parsedUsers.length} user{parsedUsers.length !== 1 ? "s" : ""} ready to import
                        </p>
                        <Button variant="ghost" size="sm" onClick={resetBulkDialog}>
                          <X className="h-4 w-4 mr-1" />Change file
                        </Button>
                      </div>

                      <div className="rounded-md border max-h-64 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Full Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Department</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parsedUsers.map((u, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">{u.fullName}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                                <TableCell>
                                  <Badge variant={u.role === "admin" ? "destructive" : u.role === "tutor" ? "default" : "secondary"}>
                                    {u.role}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">{u.department || "—"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Temporary passwords will be auto-generated. Download the credentials file after import.
                      </p>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsBulkAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleImport} disabled={saving}>
                          {saving ? "Importing…" : `Import ${parsedUsers.length} Users`}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3 – result */}
                  {importProgress && (
                    <div className="space-y-4">
                      {saving ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            Importing… {importProgress.done} / {importProgress.total}
                          </p>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${(importProgress.done / importProgress.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">
                              {importProgress.total - importProgress.errors.length} users created successfully
                            </span>
                          </div>

                          {importProgress.errors.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-destructive">
                                {importProgress.errors.length} failed:
                              </p>
                              {importProgress.errors.map((e, i) => (
                                <p key={i} className="text-xs text-destructive">{e}</p>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2 justify-end pt-2">
                            <Button
                              variant="outline"
                              onClick={() => downloadCredentials(parsedUsers.filter((_, i) =>
                                !importProgress.errors.some((e) => e.startsWith(parsedUsers[i].email))
                              ))}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download Credentials
                            </Button>
                            <Button onClick={() => setIsBulkAddOpen(false)}>Done</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* ── Single Add User Dialog ─────────────────────── */}
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
                        onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                        onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                        placeholder="Technology"
                      />
                    </div>
                    <Button onClick={handleAddUser} className="w-full" disabled={saving}>
                      Create User
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <h2 className="text-xl font-semibold">Active Students ({stats.students})</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredUsers.filter((u) => u.role === "student" && !u.isGraduated).map(renderUserCard)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graduated Tab */}
        <TabsContent value="graduated" className="space-y-4">
          <h2 className="text-xl font-semibold">Graduated Students ({stats.graduated})</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredUsers.filter((u) => u.role === "student" && u.isGraduated).length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No graduated students yet</p>
                  </div>
                ) : (
                  filteredUsers.filter((u) => u.role === "student" && u.isGraduated).map(renderUserCard)
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
                {filteredUsers.filter((u) => u.role === "tutor").map(renderUserCard)}
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
                {filteredUsers.filter((u) => u.role === "admin").map(renderUserCard)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
