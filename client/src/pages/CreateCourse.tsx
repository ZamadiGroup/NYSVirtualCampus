import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { coursesApi, usersApi } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

type CreateCourseProps = {
  onCancel?: () => void;
  onCreated?: (courseJson: unknown) => void;
};

type CourseResource = { url: string; label: string };
type CourseOutlineItem = { title: string; description: string };

export default function CreateCourse({ onCancel, onCreated }: CreateCourseProps) {
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [notes, setNotes] = useState("");
  const [pptLinks, setPptLinks] = useState<string[]>([""]);
  const [resources, setResources] = useState<CourseResource[]>([{ url: "", label: "" }]);
  const [attachments, setAttachments] = useState<string[]>([""]);
  const [tags, setTags] = useState<string>("");
  const [estimatedDuration, setEstimatedDuration] = useState<string>("");
  const [outline, setOutline] = useState<CourseOutlineItem[]>([{ title: "", description: "" }]);
  const [enrollEmails, setEnrollEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [existingCourseId, setExistingCourseId] = useState("");
  const [facilitators, setFacilitators] = useState<any[]>([]);
  const [selectedFacilitator, setSelectedFacilitator] = useState<string | null>(null);
  const { user } = useAuth();

  const courseJson = {
    title,
    department,
    notes,
    pptLinks: pptLinks.filter(Boolean),
    resources: resources.filter(r => r.url || r.label),
    attachments: attachments.filter(Boolean),
    tags: tags
      .split(",")
      .map(t => t.trim())
      .filter(Boolean),
    estimatedDuration,
    outline: outline.filter(o => o.title || o.description),
    createdAt: new Date().toISOString(),
  };

  const handleAddArrayItem = (setter: (v: any) => void, emptyValue: any) => setter((prev: any) => [...prev, emptyValue]);
  const handleRemoveArrayItem = (setter: (v: any) => void, index: number) =>
    setter((prev: any[]) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    try {
      if (!title.trim() || !department.trim()) {
        toast({ title: 'Missing fields', description: 'Title and Department are required', variant: 'destructive' });
        return;
      }
      const courseData = {
        title: courseJson.title,
        description: courseJson.notes,
        department: courseJson.department,
        // instructorId is optional; backend will default to the authenticated user
        notes: courseJson.notes,
        pptLinks: courseJson.pptLinks,
        resources: courseJson.resources,
        attachments: courseJson.attachments,
        tags: courseJson.tags,
        estimatedDuration: courseJson.estimatedDuration,
        outline: courseJson.outline,
        instructorId: selectedFacilitator || undefined,
        enrollEmails,
      };
      
      const res = await coursesApi.create(courseData);
      // API may return { course, enrollments } or the course directly
      const newCourse = (res && (res as any).course) ? (res as any).course : res;
      toast({ title: "Course created", description: "Your course has been created successfully." });
      onCreated?.(newCourse);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create course",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // If admin, fetch tutors for facilitator dropdown
    (async () => {
      try {
        if (user?.role === 'admin') {
          const list = await usersApi.getByRole('tutor');
          if (Array.isArray(list)) setFacilitators(list as any[]);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [user]);

  // Allow adding more enrollments after course creation
  const handleEnrollExisting = async (courseId: string) => {
    try {
      if (!enrollEmails.length) {
        toast({ title: 'No emails', description: 'Add at least one email to enroll', variant: 'destructive' });
        return;
      }
      const resp = await coursesApi.enroll(courseId, enrollEmails);
      toast({ title: 'Enrollments processed', description: 'Enrollment operation completed.' });
      // clear enrollEmails after processing
      setEnrollEmails([]);
    } catch (e) {
      toast({ title: 'Enrollment failed', description: e instanceof Error ? e.message : 'Failed to enroll', variant: 'destructive' });
    }
  };

  const addEmail = () => {
    const em = emailInput.trim();
    if (!em) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }
    if (enrollEmails.includes(em)) {
      setEmailInput('');
      return;
    }
    setEnrollEmails((s) => [...s, em]);
    setEmailInput('');
  };

  const removeEmail = (idx: number) => setEnrollEmails((s) => s.filter((_, i) => i !== idx));

  const enrollToExisting = async () => {
    if (!existingCourseId.trim()) {
      toast({ title: 'Missing course id', description: 'Enter the Course ID to enroll to', variant: 'destructive' });
      return;
    }
    await handleEnrollExisting(existingCourseId.trim());
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Course Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Advanced AI Techniques" />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Technology" />
            </div>
          </div>

          {facilitators.length > 0 && (
            <div>
              <Label>Assign Facilitator</Label>
              <div className="flex gap-2 items-center">
                <select value={selectedFacilitator || ''} onChange={(e) => setSelectedFacilitator(e.target.value || null)} className="border rounded px-2 py-1">
                  <option value="">-- Choose facilitator --</option>
                  {facilitators.map((f) => (
                    <option key={f._id || f.id} value={f._id || f.id}>{f.fullName} ({f.email})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Course Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Brief description or notes..." />
            <p className="text-xs text-muted-foreground mt-1">Include key objectives, prerequisites, or grading info.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>PPT Links</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddArrayItem(setPptLinks, "")}>
                <Plus className="mr-2 h-4 w-4" /> Add link
              </Button>
            </div>
            {pptLinks.map((link, idx) => (
              <div key={idx} className="flex gap-2">
                <Input value={link} onChange={(e) => setPptLinks(pptLinks.map((v, i) => (i === idx ? e.target.value : v)))} placeholder="https://..." />
                {pptLinks.length > 1 && (
                  <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveArrayItem(setPptLinks, idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Additional Resources</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddArrayItem(setResources, { url: "", label: "" })}>
                <Plus className="mr-2 h-4 w-4" /> Add resource
              </Button>
            </div>
            {resources.map((res, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input className="md:col-span-3" value={res.url} onChange={(e) => setResources(resources.map((r, i) => (i === idx ? { ...r, url: e.target.value } : r)))} placeholder="https://resource..." />
                <Input className="md:col-span-2" value={res.label} onChange={(e) => setResources(resources.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)))} placeholder="Label (e.g. Syllabus)" />
                <div className="flex items-center">
                  {resources.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveArrayItem(setResources, idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Attachments (links)</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddArrayItem(setAttachments, "")}>
                <Plus className="mr-2 h-4 w-4" /> Add attachment
              </Button>
            </div>
            {attachments.map((att, idx) => (
              <div key={idx} className="flex gap-2">
                <Input value={att} onChange={(e) => setAttachments(attachments.map((v, i) => (i === idx ? e.target.value : v)))} placeholder="https://attachment..." />
                {attachments.length > 1 && (
                  <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveArrayItem(setAttachments, idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma,separated,tags" />
            </div>
            <div>
              <Label htmlFor="duration">Estimated Duration</Label>
              <Input id="duration" value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)} placeholder="e.g. 8 weeks" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Outline</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddArrayItem(setOutline, { title: "", description: "" })}>
                <Plus className="mr-2 h-4 w-4" /> Add section
              </Button>
            </div>
            {outline.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input className="md:col-span-2" value={item.title} onChange={(e) => setOutline(outline.map((o, i) => (i === idx ? { ...o, title: e.target.value } : o)))} placeholder="Section title" />
                <Textarea className="md:col-span-3" value={item.description} onChange={(e) => setOutline(outline.map((o, i) => (i === idx ? { ...o, description: e.target.value } : o)))} placeholder="What is covered in this section?" />
                <div className="flex items-center">
                  {outline.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveArrayItem(setOutline, idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Enroll students by email</Label>
            <div className="flex gap-2">
              <Input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="student@example.com" />
              <Button onClick={addEmail}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {enrollEmails.map((em, i) => (
                <div key={i} className="px-3 py-1 bg-muted rounded-full flex items-center gap-2">
                  <span className="text-sm">{em}</span>
                  <button type="button" onClick={() => removeEmail(i)} className="text-red-600 text-xs">x</button>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t pt-3">
              <Label>Add emails to an existing course</Label>
              <div className="flex gap-2 mt-2">
                <Input placeholder="Existing Course ID" value={existingCourseId} onChange={(e) => setExistingCourseId(e.target.value)} />
                <Button onClick={enrollToExisting} variant="outline">Enroll</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Use this to add the emails you added above to an already created course.</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex flex-wrap gap-2">
              {(courseJson.tags as string[]).map((t, i) => (
                <Badge key={`${t}-${i}`} variant="secondary">{t}</Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="button" onClick={handleSubmit} data-testid="button-submit-course">Create Course</Button>
              {/* If course already exists (in editing mode) we could call handleEnrollExisting(courseId) */}
            </div>
          </div>
        </CardContent>
      </Card>

      
    </div>
  );
}


