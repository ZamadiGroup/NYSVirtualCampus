import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, UploadCloud } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { coursesApi } from '@/lib/api';

type Chapter = {
  title: string;
  notes: string;
  pptFiles: File[];
};

interface Props {
  onCourseAdded?: () => void;
}

export function AddCourseFullScreen({ onCourseAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([
    { title: 'Introduction', notes: '', pptFiles: [] },
  ]);
  const [enrollEmails, setEnrollEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  const addChapter = () => setChapters((c) => [...c, { title: '', notes: '', pptFiles: [] }]);
  const removeChapter = (idx: number) => setChapters((c) => c.filter((_, i) => i !== idx));
  const updateChapter = (idx: number, patch: Partial<Chapter>) =>
    setChapters((c) => c.map((ch, i) => (i === idx ? { ...ch, ...patch } : ch)));

  const handleFileChange = (idx: number, files: FileList | null) => {
    if (!files) return;
    updateChapter(idx, { pptFiles: Array.from(files) });
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }
    if (enrollEmails.includes(email)) {
      setEmailInput('');
      return;
    }
    setEnrollEmails((s) => [...s, email]);
    setEmailInput('');
  };

  const removeEmail = (idx: number) => setEnrollEmails((s) => s.filter((_, i) => i !== idx));

  const handleSave = async (publish = false) => {
    setIsLoading(true);
    try {
      // basic validation
      if (!title.trim() || !department.trim()) {
        toast({ title: 'Missing fields', description: 'Title and Department are required', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // helper to upload a single File as base64 to /api/uploads
      const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      };

      const uploadFile = async (file: File) => {
        const buf = await file.arrayBuffer();
        const b64 = arrayBufferToBase64(buf);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch('/api/uploads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ filename: file.name, contentBase64: b64 }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(err.error || 'Upload failed');
        }
        const data = await res.json();
        return data.url as string;
      };
      // Build chapters payload and upload chapter files
      const chaptersPayload: any[] = [];
      for (const ch of chapters) {
        const materials: any[] = [];
        if (ch.pptFiles && ch.pptFiles.length) {
          const urls = await Promise.all(ch.pptFiles.map(async (f) => ({ url: await uploadFile(f), label: f.name, type: 'ppt' })));
          materials.push(...urls);
        }
        chaptersPayload.push({ title: ch.title || 'Untitled', description: ch.notes || '', materials });
      }

      const courseData: any = {
        title,
        description,
        department,
        thumbnail,
        estimatedDuration,
        tags: [],
        notes: '',
        chapters: chaptersPayload,
        isActive: publish,
        // Include enrollment emails so server-side code could invite students (handled by server)
        enrollEmails,
      };

      const newCourse = await coursesApi.create(courseData);
      toast({ title: publish ? 'Course published' : 'Course saved', description: `${title} has been ${publish ? 'published' : 'saved'}.` });
      setOpen(false);
      // reset
      setTitle(''); setDepartment(''); setDescription(''); setEstimatedDuration(''); setThumbnail(''); setChapters([{ title: 'Introduction', notes: '', pptFiles: [] }]); setEnrollEmails([]);
      onCourseAdded?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to save course', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Prefetch existing courses to show in the sidebar
  useEffect(() => {
    let mounted = true;
    const fetchCourses = async () => {
      setCoursesLoading(true);
      try {
        const res = await coursesApi.getAll();
        if (!mounted) return;
        setCourses(Array.isArray(res) ? res : []);
      } catch (e) {
        console.warn('Failed to load courses for sidebar', e);
        setCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
    return () => { mounted = false; };
  }, []);

  // Prefill form from a selected course (sidebar)
  const prefillFromCourse = (c: any) => {
    setTitle(c.title || '');
    setDepartment(c.department || '');
    setDescription(c.description || c.notes || '');
    setEstimatedDuration(c.estimatedDuration || '');
    setThumbnail(c.thumbnail || '');
    // prefer chapters, fall back to outline for older data
    if (Array.isArray(c.chapters) && c.chapters.length) {
      setChapters(c.chapters.map((o: any) => ({ title: o.title || 'Untitled', notes: o.description || '', pptFiles: [] })));
    } else if (Array.isArray(c.outline) && c.outline.length) {
      setChapters(c.outline.map((o: any) => ({ title: o.title || 'Untitled', notes: o.description || '', pptFiles: [] })));
    }
    if (Array.isArray(c.pptLinks)) {
      // put existing ppt links into enrollEmails array? no — we keep pptLinks returned from upload step
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-course-fullscreen">
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </Button>
      </DialogTrigger>
      <DialogContent className="left-0 top-0 translate-x-0 translate-y-0 w-full h-full max-w-none rounded-none p-0 overflow-hidden">
        {/* Fixed header */}
        <div className="sticky top-0 z-40 w-full bg-white border-b shadow-sm flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Create Course</h3>
            <span className="text-sm text-muted-foreground">Full screen editor</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </div>

        <div className="flex h-[calc(100vh-4rem)]">{
          /* Sidebar + main content */
        }
          <aside className="w-72 border-r p-4 overflow-auto bg-surface">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">My Courses</h4>
              <Button variant="outline" size="sm" onClick={() => { setCoursesLoading(true); coursesApi.getAll().then((r) => setCourses(Array.isArray(r) ? r : [])).catch(() => setCourses([])).finally(() => setCoursesLoading(false)); }}>Refresh</Button>
            </div>
            {coursesLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-2">
                {courses.length === 0 && <div className="text-sm text-muted-foreground">No courses found.</div>}
                {courses.map((c) => (
                  <div key={c._id || c.id} className="p-2 rounded hover:bg-muted cursor-pointer" onClick={() => prefillFromCourse(c)}>
                    <div className="font-medium truncate">{c.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.department} • {c.instructorId?.fullName || c.instructorName}</div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          <main className="flex-1 p-6 overflow-auto">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Course Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter course title" required />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., Technology" />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Estimated duration</Label>
                  <Input value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)} placeholder="e.g., 8 weeks" />
                </div>
                <div>
                  <Label>Thumbnail URL</Label>
                  <Input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://..." />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Chapters</Label>
                  <Button variant="outline" size="sm" onClick={addChapter}><Plus className="mr-2 h-4 w-4"/>Add chapter</Button>
                </div>

                <div className="space-y-4">
                  {chapters.map((ch, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-start">
                        <div className="md:col-span-2">
                          <Label>Title</Label>
                          <Input value={ch.title} onChange={(e) => updateChapter(idx, { title: e.target.value })} />
                        </div>
                        <div className="md:col-span-3">
                          <Label>Notes</Label>
                          <Textarea value={ch.notes} onChange={(e) => updateChapter(idx, { notes: e.target.value })} rows={3} />
                        </div>
                        <div className="md:col-span-1">
                          <Label>Upload PPT</Label>
                          <input type="file" accept=".ppt,.pptx,.pdf" multiple onChange={(e) => handleFileChange(idx, e.target.files)} className="mt-1" />
                          <div className="mt-2 text-sm text-muted-foreground">
                            {ch.pptFiles.map((f) => (
                              <div key={f.name} className="truncate">{f.name}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end mt-3">
                        {chapters.length > 1 && (
                          <Button variant="destructive" size="sm" onClick={() => removeChapter(idx)}>Remove</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
                <Button onClick={() => handleSave(false)} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save draft'}</Button>
                <Button onClick={() => handleSave(true)} disabled={isLoading} data-testid="button-publish-course">{isLoading ? 'Publishing...' : 'Publish'}</Button>
              </div>
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddCourseFullScreen;
