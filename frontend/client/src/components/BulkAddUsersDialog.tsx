import { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usersApi } from "@/lib/api";
import { Upload, Download, AlertCircle, CheckCircle2, X } from "lucide-react";

interface ParsedUser {
  fullName: string;
  email: string;
  password: string;
  role: string;
  department: string;
}

interface BulkResult {
  total: number;
  created: number;
  failed: { row: number; email: string; error: string }[];
}

interface Props {
  onDone: () => void;
}

const REQUIRED_COLUMNS = ["fullName", "email", "password"];
const VALID_ROLES = ["student", "tutor", "admin"];
const TEMPLATE_ROWS = [
  ["fullName", "email", "password", "role", "department"],
  ["Alice Mwangi", "alice@nys.go.ke", "Password123", "student", "ICT"],
  ["Bob Otieno", "bob@nys.go.ke", "Password123", "tutor", "Engineering"],
  ["Carol Njeri", "carol@nys.go.ke", "Password123", "student", "Health Sciences"],
];

export default function BulkAddUsersDialog({ onDone }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setParsedUsers([]);
    setParseError(null);
    setResult(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) reset();
  };

  const normalizeRow = (row: Record<string, string>): ParsedUser => {
    // Case-insensitive column matching
    const get = (key: string) => {
      const found = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase());
      return found ? (row[found] || "").trim() : "";
    };
    return {
      fullName: get("fullname") || get("full_name") || get("name"),
      email: get("email"),
      password: get("password"),
      role: VALID_ROLES.includes(get("role").toLowerCase()) ? get("role").toLowerCase() : "student",
      department: get("department") || get("dept") || "",
    };
  };

  const validateRows = (rows: ParsedUser[]): string | null => {
    if (rows.length === 0) return "File is empty or has no data rows.";
    if (rows.length > 500) return "Maximum 500 users per import.";
    const missing = rows.some(r => !r.fullName || !r.email || !r.password);
    if (missing) return "Some rows are missing required fields (fullName, email, password). Check highlighted rows below.";
    return null;
  };

  const handleFile = (file: File) => {
    setParseError(null);
    setResult(null);
    setFileName(file.name);

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: ({ data, errors }) => {
          if (errors.length > 0) {
            setParseError(`CSV parse error: ${errors[0].message}`);
            return;
          }
          const rows = data.map(normalizeRow);
          setParseError(validateRows(rows));
          setParsedUsers(rows);
        },
        error: (err) => setParseError(`Failed to parse CSV: ${err.message}`),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target?.result, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
          const rows = data.map(normalizeRow);
          setParseError(validateRows(rows));
          setParsedUsers(rows);
        } catch (err: any) {
          setParseError(`Failed to parse Excel file: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setParseError("Unsupported file type. Please upload a .csv, .xlsx, or .xls file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async () => {
    if (parsedUsers.length === 0 || parseError) return;
    setLoading(true);
    try {
      const res = await usersApi.bulkCreate(parsedUsers) as BulkResult;
      setResult(res);
      if (res.created > 0) {
        toast({ title: `${res.created} user(s) imported successfully` });
        onDone();
      }
      if (res.failed.length > 0) {
        toast({
          title: `${res.failed.length} row(s) failed`,
          description: "See details below",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ title: "Import failed", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet(TEMPLATE_ROWS);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "nys_bulk_users_template.xlsx");
  };

  const isRowInvalid = (row: ParsedUser) => !row.fullName || !row.email || !row.password;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Users</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Download the template, fill it in, then upload below.
              <br />
              Required columns: <strong>fullName, email, password</strong>. Optional: <em>role</em> (student/tutor/admin), <em>department</em>.
            </p>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Template
            </Button>
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-muted/30 transition-colors"
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">
                {fileName ? fileName : "Drop your file here or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Supports .csv, .xlsx, .xls — max 500 rows</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview table */}
          {parsedUsers.length > 0 && !result && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{parsedUsers.length} row(s) parsed</p>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              </div>
              <div className="border rounded-lg overflow-auto max-h-64">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">#</th>
                      <th className="text-left p-2 font-medium">Full Name</th>
                      <th className="text-left p-2 font-medium">Email</th>
                      <th className="text-left p-2 font-medium">Role</th>
                      <th className="text-left p-2 font-medium">Department</th>
                      <th className="text-left p-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedUsers.map((u, i) => (
                      <tr key={i} className={isRowInvalid(u) ? "bg-destructive/10" : ""}>
                        <td className="p-2 text-muted-foreground">{i + 1}</td>
                        <td className="p-2">{u.fullName || <span className="text-destructive">missing</span>}</td>
                        <td className="p-2">{u.email || <span className="text-destructive">missing</span>}</td>
                        <td className="p-2">
                          <Badge variant={u.role === "admin" ? "destructive" : u.role === "tutor" ? "default" : "secondary"}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-2 text-muted-foreground">{u.department || "—"}</td>
                        <td className="p-2">
                          {isRowInvalid(u)
                            ? <span className="text-destructive text-xs">Invalid</span>
                            : <span className="text-green-600 text-xs">Ready</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={loading || !!parseError || parsedUsers.every(isRowInvalid)}
              >
                {loading ? "Importing..." : `Import ${parsedUsers.filter(r => !isRowInvalid(r)).length} Valid Users`}
              </Button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{result.total}</p>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{result.created}</p>
                  <p className="text-xs text-muted-foreground">Created</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">{result.failed.length}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>

              {result.created > 0 && (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  {result.created} user(s) were successfully created.
                </div>
              )}

              {result.failed.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">Failed rows:</p>
                  <div className="border rounded-lg overflow-auto max-h-40">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Row</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.failed.map((f, i) => (
                          <tr key={i}>
                            <td className="p-2">{f.row}</td>
                            <td className="p-2">{f.email}</td>
                            <td className="p-2 text-destructive">{f.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={reset}>Import Another File</Button>
                <Button className="flex-1" onClick={() => handleClose(false)}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
