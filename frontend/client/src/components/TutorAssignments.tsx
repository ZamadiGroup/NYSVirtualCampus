import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FileText, Trash2, Edit } from "lucide-react";
import CreateAssignment, { AssignmentDraft } from "@/pages/CreateAssignment";
import { assignmentsApi, coursesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type CourseLike = { id: string; title: string };

type Props = {
  courses: CourseLike[];
  assignments: AssignmentDraft[];
  onAddAssignment?: (a: any) => void;
  onUpdateAssignment?: (a: any) => void;
  onDeleteAssignment?: (id: string) => void;
  onOpenAssignment?: (id: string) => void;
};

export default function TutorAssignments({ courses, assignments, onAddAssignment, onUpdateAssignment, onDeleteAssignment, onOpenAssignment }: Props) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createCourseId, setCreateCourseId] = useState<string | undefined>(undefined);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<AssignmentDraft | null>(null);
  const { toast } = useToast();
  const [localCourses, setLocalCourses] = useState<CourseLike[]>(courses || []);

  // normalize assignment.courseId to a string id for comparisons
  const getAssignmentCourseId = (a: any) => {
    if (!a) return undefined;
    if (typeof a.courseId === 'string') return a.courseId;
    if (a.courseId && (a.courseId.id || a.courseId._id)) return a.courseId.id || a.courseId._id;
    return String(a.courseId);
  };

  // If parent didn't supply courses, fetch tutor's courses so we can show titles
  React.useEffect(() => {
    let mounted = true;
    if ((!courses || courses.length === 0) && mounted) {
      coursesApi.getMine()
        .then((res: any) => {
          if (!mounted) return;
          const mapped = Array.isArray(res) ? res.map((c: any) => ({ id: c.id || c._id, title: c.title })) : [];
          setLocalCourses(mapped);
        })
        .catch(() => {
          // ignore - we'll show assignments grouped by raw ids
        });
    } else {
      // keep localCourses in sync when parent passes courses
      setLocalCourses((courses || []).map((c) => ({ id: (c as any).id || (c as any)._id, title: c.title })));
    }
    return () => { mounted = false; };
  }, [courses]);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Delete this assignment?')) return;
    try {
      await assignmentsApi.delete(id);
      toast({ title: 'Assignment deleted', description: 'Assignment removed.' });
      onDeleteAssignment?.(id);
    } catch (err) {
      // fallback: notify and call parent cleanup
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
      onDeleteAssignment?.(id);
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) setCreateCourseId(undefined); setIsCreateOpen(open); }}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Assignment
          </Button>
        </DialogTrigger>
        <DialogContent>
          <CreateAssignment
            courseId={createCourseId}
            onCancel={() => { setIsCreateOpen(false); setCreateCourseId(undefined); }}
            onCreated={(assignment) => {
              onAddAssignment?.(assignment);
              setIsCreateOpen(false);
              setCreateCourseId(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {localCourses.map((course) => {
          const courseAssignments = (assignments || []).filter((a) => getAssignmentCourseId(a) === course.id);
          return (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{course.title} - Assignments ({courseAssignments.length})</CardTitle>
                  <div>
                    <Button size="sm" onClick={() => { setCreateCourseId(course.id); setIsCreateOpen(true); }}>
                      <Plus className="mr-2 h-3 w-3" /> Create Assignment
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {courseAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assignments yet</p>
                ) : (
                  <div className="space-y-2">
                    {courseAssignments.map((assignment) => (
                      <div key={assignment.id} className="p-3 border rounded-lg flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">{assignment.type === 'upload' ? 'File Submission' : 'Auto-graded Quiz'}</p>
                          <p className="text-xs text-muted-foreground">Due: {assignment.dueDate}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { if (onOpenAssignment && assignment.id) { onOpenAssignment(assignment.id); } else { setEditDraft(assignment); setIsEditOpen(true); } }} title="Open assignment">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setEditDraft(assignment); setIsEditOpen(true); }} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment.id)} title="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          {editDraft && (
            <CreateAssignment
              initialAssignment={editDraft}
              onCancel={() => { setIsEditOpen(false); setEditDraft(null); }}
              onUpdated={(updated) => {
                onUpdateAssignment?.(updated);
                setIsEditOpen(false);
                setEditDraft(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
