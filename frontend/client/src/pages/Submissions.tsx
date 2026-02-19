import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { coursesApi, submissionsApi, gradesApi, usersApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/useAuth';
import { FileText, Award, Clock, TrendingUp, CheckCircle2, Download, Search } from 'lucide-react';

type Course = { id: string; title: string };

export default function SubmissionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>(undefined);
  const [selectedStudent, setSelectedStudent] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded'>('all');
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [gradingDraft, setGradingDraft] = useState<any | null>(null);
  const [isViewGradeOpen, setIsViewGradeOpen] = useState(false);
  const [viewGradeDraft, setViewGradeDraft] = useState<any | null>(null);
  const { toast } = useToast();

  const loadCourses = async () => {
    try {
      const res = isAdmin ? await coursesApi.getAll() : await coursesApi.getMine();
      const normalized = Array.isArray(res) ? res.map((c: any) => ({ id: c.id || c._id, title: c.title })) : [];
      setCourses(normalized);
    } catch (err) {
      console.error('Failed to load courses', err);
    }
  };

  const loadStudents = async () => {
    if (!isAdmin) return;
    try {
      const res = await usersApi.getAll();
      const studentList = Array.isArray(res) ? res.filter((u: any) => u.role === 'student').map((u: any) => ({ ...u, id: u.id || u._id })) : [];
      setStudents(studentList);
    } catch (err) {
      console.error('Failed to load students', err);
    }
  };

  const loadSubmissions = async () => {
    try {
      const res: any = await submissionsApi.getAll({ 
        courseId: selectedCourse, 
        studentId: selectedStudent,
        status: statusFilter === 'all' ? undefined : statusFilter, 
        page, 
        limit 
      });
      if (res && Array.isArray(res.items)) {
        setSubmissions(res.items);
        setTotal(res.total || 0);
      } else {
        setSubmissions([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('Failed to load submissions', err);
      setSubmissions([]);
      setTotal(0);
    }
  };

  useEffect(() => { 
    loadCourses(); 
    if (isAdmin) loadStudents();
  }, []);
  useEffect(() => { setPage(1); }, [selectedCourse, selectedStudent, statusFilter, searchTerm]);
  useEffect(() => { loadSubmissions(); }, [selectedCourse, selectedStudent, statusFilter, page]);

  // Admin analytics
  const analytics = useMemo(() => {
    if (!isAdmin) return null;
    const totalSubmissions = submissions.length;
    const gradedCount = submissions.filter((s) => s.grade).length;
    const lateCount = submissions.filter((s) => {
      const dueDate = s.assignmentId?.dueDate || s.assignment?.dueDate;
      const submittedAt = s.submittedAt || s.createdAt;
      return dueDate && submittedAt && new Date(submittedAt) > new Date(dueDate);
    }).length;
    const totalScore = submissions.reduce((sum, s) => sum + (s.grade?.score || 0), 0);
    const avgScore = gradedCount > 0 ? (totalScore / gradedCount).toFixed(1) : '0';
    const completionRate = totalSubmissions > 0 ? ((gradedCount / totalSubmissions) * 100).toFixed(0) : '0';
    
    return { totalSubmissions, gradedCount, lateCount, avgScore, completionRate };
  }, [submissions, isAdmin]);

  // Filter by search term
  const filteredSubmissions = useMemo(() => {
    if (!searchTerm) return submissions;
    const term = searchTerm.toLowerCase();
    return submissions.filter((s) => 
      s.student?.fullName?.toLowerCase().includes(term) ||
      s.studentId?.fullName?.toLowerCase().includes(term) ||
      s.assignment?.title?.toLowerCase().includes(term) ||
      s.assignmentId?.title?.toLowerCase().includes(term)
    );
  }, [submissions, searchTerm]);

  const openGrade = (submission: any) => {
    setGradingDraft({ 
      submission, 
      score: submission.grade?.score ?? submission.assignmentId?.maxScore ?? submission.assignment?.maxScore ?? 100, 
      feedback: submission.grade?.feedback || '' 
    });
    setIsGradingOpen(true);
  };

  const openViewGrade = (submission: any) => {
    setViewGradeDraft(submission);
    setIsViewGradeOpen(true);
  };

  const submitGrade = async () => {
    if (!gradingDraft) return;
    try {
      const { submission, score, feedback } = gradingDraft;
      const payload = {
        assignmentId: submission.assignmentId._id || submission.assignmentId,
        studentId: submission.studentId._id || submission.studentId,
        score,
        maxScore: submission.assignmentId?.maxScore || submission.assignment?.maxScore || 100,
        feedback,
      };
      
      if (submission.grade) {
        await gradesApi.update(submission.grade._id || submission.grade.id, { score, feedback });
        toast({ title: 'Updated', description: 'Grade updated successfully.' });
      } else {
        await gradesApi.create(payload);
        toast({ title: 'Graded', description: 'Submission graded successfully.' });
      }
      
      setIsGradingOpen(false);
      setGradingDraft(null);
      await loadSubmissions();
    } catch (err) {
      console.error('Failed to grade', err);
      toast({ title: 'Failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    }
  };

  const toggleSubmissionSelection = (id: string) => {
    const newSet = new Set(selectedSubmissions);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedSubmissions(newSet);
  };

  const selectAllSubmissions = () => {
    if (selectedSubmissions.size === filteredSubmissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(filteredSubmissions.map((s) => s._id)));
    }
  };

  const bulkDownloadSubmissions = () => {
    const selected = filteredSubmissions.filter((s) => selectedSubmissions.has(s._id));
    if (selected.length === 0) {
      toast({ title: 'No selections', description: 'Select at least one submission to download', variant: 'destructive' });
      return;
    }
    
    const data = selected.map((s) => ({
      student: s.student?.fullName || s.studentId?.fullName || 'Unknown',
      assignment: s.assignment?.title || s.assignmentId?.title || 'Unknown',
      submittedAt: new Date(s.submittedAt || s.createdAt).toLocaleString(),
      score: s.grade?.score || 'Not graded',
      feedback: s.grade?.feedback || 'No feedback',
      uploadLink: s.uploadLink || 'N/A',
    }));
    
    const csv = [
      ['Student', 'Assignment', 'Submitted At', 'Score', 'Feedback', 'Upload Link'].join(','),
      ...data.map((row) => Object.values(row).map((v) => `"${v}"`).join(',')),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Downloaded', description: `${selected.length} submission(s) downloaded` });
    setSelectedSubmissions(new Set());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Submissions</h1>
        <p className="text-muted-foreground">Review and grade student submissions.</p>
      </div>

      {/* Admin Analytics Cards */}
      {isAdmin && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                  <p className="text-2xl font-bold">{analytics.totalSubmissions}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Graded</p>
                  <p className="text-2xl font-bold">{analytics.gradedCount}</p>
                </div>
                <Award className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Late Submissions</p>
                  <p className="text-2xl font-bold">{analytics.lateCount}</p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">{analytics.avgScore}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold">{analytics.completionRate}%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm block mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Student or assignment..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm block mb-1">Course</label>
              <Select value={selectedCourse ?? '__all__'} onValueChange={(v) => setSelectedCourse(v === '__all__' ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Courses</SelectItem>
                  {courses.map((c) => (<SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <div>
                <label className="text-sm block mb-1">Student</label>
                <Select value={selectedStudent ?? '__all__'} onValueChange={(v) => setSelectedStudent(v === '__all__' ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Students</SelectItem>
                    {students.map((s) => (<SelectItem key={s.id} value={s.id}>{s.fullName || s.username}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm block mb-1">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="graded">Graded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={() => { setSelectedCourse(undefined); setSelectedStudent(undefined); setStatusFilter('all'); setSearchTerm(''); }}>
              Reset Filters
            </Button>
            {isAdmin && selectedSubmissions.size > 0 && (
              <Button onClick={bulkDownloadSubmissions}>
                <Download className="mr-2 h-4 w-4" />
                Download Selected ({selectedSubmissions.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Selection Controls */}
      {isAdmin && filteredSubmissions.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedSubmissions.size === filteredSubmissions.length}
            onCheckedChange={selectAllSubmissions}
          />
          <span className="text-sm">Select All ({filteredSubmissions.length})</span>
        </div>
      )}

      {/* Submissions list */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No submissions match the selected filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredSubmissions.map((s: any) => {
            const dueDate = s.assignmentId?.dueDate || s.assignment?.dueDate;
            const submittedAt = s.submittedAt || s.createdAt;
            const isLate = dueDate && submittedAt && new Date(submittedAt) > new Date(dueDate);
            
            return (
              <Card key={s._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isAdmin && (
                        <Checkbox
                          checked={selectedSubmissions.has(s._id)}
                          onCheckedChange={() => toggleSubmissionSelection(s._id)}
                        />
                      )}
                      <div>
                        <CardTitle className="text-lg">{s.assignment?.title || s.assignmentId?.title || 'Untitled'}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {s.student?.fullName || s.studentId?.fullName || 'Unknown Student'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLate && <Badge variant="destructive">Late</Badge>}
                      {s.grade ? (
                        <Badge variant="default">Graded ({s.grade.score}/{s.grade.maxScore})</Badge>
                      ) : (
                        <Badge variant="secondary">Submitted</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      <p>Submitted: {new Date(submittedAt).toLocaleString()}</p>
                      {s.uploadLink && (
                        <a href={s.uploadLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          View Submission
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {s.grade ? (
                        <>
                          <Dialog open={isViewGradeOpen && viewGradeDraft?._id === s._id} onOpenChange={(open) => { if (!open) setIsViewGradeOpen(false); }}>
                            <DialogTrigger asChild>
                              <Button onClick={() => openViewGrade(s)}>View Grade</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Grade Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm"><strong>Student:</strong> {s.student?.fullName || s.studentId?.fullName}</p>
                                <p className="text-sm"><strong>Assignment:</strong> {s.assignment?.title || s.assignmentId?.title}</p>
                                <p className="text-sm"><strong>Score:</strong> {s.grade.score} / {s.grade.maxScore}</p>
                                {s.grade.feedback && (
                                  <div>
                                    <p className="text-sm font-medium">Feedback</p>
                                    <p className="text-sm text-muted-foreground">{s.grade.feedback}</p>
                                  </div>
                                )}
                                <div className="flex justify-end">
                                  <Button onClick={() => setIsViewGradeOpen(false)}>Close</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {isAdmin && (
                            <Button variant="outline" onClick={() => openGrade(s)}>
                              Modify Grade
                            </Button>
                          )}
                        </>
                      ) : (
                        <Dialog open={isGradingOpen && gradingDraft?.submission._id === s._id} onOpenChange={(open) => { if (!open) { setIsGradingOpen(false); setGradingDraft(null); } }}>
                          <DialogTrigger asChild>
                            <Button onClick={() => openGrade(s)}>Grade</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Grade Submission</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm block mb-1">Score</label>
                                <Input type="number" value={gradingDraft?.score ?? ''} onChange={(e) => setGradingDraft({ ...gradingDraft, score: Number(e.target.value) })} />
                              </div>
                              <div>
                                <label className="text-sm block mb-1">Feedback (optional)</label>
                                <Textarea value={gradingDraft?.feedback ?? ''} onChange={(e) => setGradingDraft({ ...gradingDraft, feedback: e.target.value })} rows={6} />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => { setIsGradingOpen(false); setGradingDraft(null); }}>Cancel</Button>
                                <Button onClick={submitGrade}>Submit Grade</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {Math.min((page-1)*limit+1, total || 0)} - {Math.min(page*limit, total || 0)} of {total} submissions
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page <= 1}>Previous</Button>
          <Button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total}>Next</Button>
        </div>
      </div>
    </div>
  );
}
