import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { coursesApi, usersApi, uploadsApi } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

type CreateCourseProps = {
  onCancel?: () => void;
  onCreated?: (courseJson: unknown) => void;
  initialCourse?: any;
  onUpdated?: (courseJson: unknown) => void;
};

type CourseResource = { url: string; label: string };
type CourseOutlineItem = { title: string; description: string };
type CourseChapter = {
  title: string;
  notes?: string;
  files?: string[]; // uploaded urls (existing stored files)
  existingFiles?: string[]; // alias for clarity
  removedExistingFiles?: string[]; // urls marked for deletion
  pptLinks?: string[];
  _selectedFiles?: File[]; // local temporary files before upload
};

type CourseModule = {
  title: string;
  chapters: CourseChapter[];
};

export default function CreateCourse({ onCancel, onCreated, initialCourse, onUpdated }: CreateCourseProps) {
  // If initialCourse is provided, the component behaves as an editor
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [notes, setNotes] = useState("");
  const [pptLinks, setPptLinks] = useState<string[]>([""]);
  const [resources, setResources] = useState<CourseResource[]>([{ url: "", label: "" }]);
  const [attachments, setAttachments] = useState<string[]>([""]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const [removedExistingAttachments, setRemovedExistingAttachments] = useState<string[]>([]);
  const [tags, setTags] = useState<string>("");
  const [estimatedDuration, setEstimatedDuration] = useState<string>("");
  const [outline, setOutline] = useState<CourseOutlineItem[]>([{ title: "", description: "" }]);
  const [modules, setModules] = useState<CourseModule[]>([
    { title: "", chapters: [{ title: "", notes: "", files: [], pptLinks: [], _selectedFiles: [] }] },
  ]);
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

  const addModule = () => setModules((prev) => [...prev, { title: "", chapters: [{ title: "", notes: "", files: [], pptLinks: [], _selectedFiles: [] }] }]);
  const removeModule = (index: number) => setModules((prev) => prev.filter((_, i) => i !== index));
  const addChapter = (moduleIndex: number) => setModules((prev) => prev.map((m, mi) => mi === moduleIndex ? { ...m, chapters: [...m.chapters, { title: "", notes: "", files: [], pptLinks: [], _selectedFiles: [] }] } : m));
  const removeChapter = (moduleIndex: number, chapterIndex: number) => setModules((prev) => prev.map((m, mi) => mi === moduleIndex ? { ...m, chapters: m.chapters.filter((_, ci) => ci !== chapterIndex) } : m));

  const handleChapterFilesSelected = (moduleIndex: number, chapterIndex: number, files: FileList | null) => {
    if (!files) return;
    setModules((prev) => prev.map((m, mi) => {
      if (mi !== moduleIndex) return m;
      return { ...m, chapters: m.chapters.map((c, ci) => {
        if (ci !== chapterIndex) return c;
        const existing = c._selectedFiles || [];
        return { ...c, _selectedFiles: [...existing, ...Array.from(files)] } as CourseChapter;
      }) };
    }));
  };

  const removeChapterSelectedFile = (moduleIndex: number, chapterIndex: number, fileIndex: number) => {
    setModules((prev) => prev.map((m, mi) => {
      if (mi !== moduleIndex) return m;
      return { ...m, chapters: m.chapters.map((c, ci) => {
        if (ci !== chapterIndex) return c;
        const sel = (c._selectedFiles || []).filter((_, fi) => fi !== fileIndex);
        return { ...c, _selectedFiles: sel } as CourseChapter;
      }) };
    }));
  };

  const addChapterPptLink = (moduleIndex: number, chapterIndex: number) => {
    setModules((prev) => prev.map((m, mi) => {
      if (mi !== moduleIndex) return m;
      return { ...m, chapters: m.chapters.map((c, ci) => ci === chapterIndex ? { ...c, pptLinks: [...(c.pptLinks || []), ""] } : c) };
    }));
  };

  const removeChapterPptLink = (moduleIndex: number, chapterIndex: number, pptIndex: number) => {
    setModules((prev) => prev.map((m, mi) => {
      if (mi !== moduleIndex) return m;
      return { ...m, chapters: m.chapters.map((c, ci) => {
        if (ci !== chapterIndex) return c;
        return { ...c, pptLinks: (c.pptLinks || []).filter((_, pi) => pi !== pptIndex) };
      }) };
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!title.trim() || !department.trim()) {
        toast({ title: 'Missing fields', description: 'Title and Department are required', variant: 'destructive' });
        return;
      }
      // If any files selected, upload them first and collect urls
      const uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        for (const f of selectedFiles) {
          try {
            const r = await uploadsApi.upload(f);
            if (r && r.url) uploadedUrls.push(r.url);
          } catch (err) {
            console.error('File upload failed', err);
            toast({ title: 'Upload failed', description: `Failed to upload ${f.name}`, variant: 'destructive' });
          }
        }
      }

      // Process modules -> flatten into chapters for the backend schema
      const chaptersPayload: any[] = [];
      for (const m of modules) {
        for (const c of m.chapters) {
          const uploadedChapterUrls: string[] = [];
          if (c._selectedFiles && c._selectedFiles.length > 0) {
            for (const f of c._selectedFiles) {
              try {
                const rr = await uploadsApi.upload(f);
                if (rr && rr.url) uploadedChapterUrls.push(rr.url);
              } catch (err) {
                console.error('Chapter file upload failed', err);
                toast({ title: 'Upload failed', description: `Failed to upload ${f.name} for chapter ${c.title}`, variant: 'destructive' });
              }
            }
          }

          const materials: any[] = [];
          // keep existing files that were NOT marked for deletion
          const remainingExisting = (c.existingFiles || []).filter((u) => !(c.removedExistingFiles || []).includes(u));
          remainingExisting.forEach((u) => materials.push({ type: 'file', url: u, label: '' }));
          uploadedChapterUrls.forEach((u) => materials.push({ type: 'file', url: u, label: '' }));
          (c.pptLinks || []).forEach((p) => materials.push({ type: 'ppt', url: p, label: '' }));

          chaptersPayload.push({
            title: `${m.title ? m.title + ' - ' : ''}${c.title || ''}`.trim(),
            description: c.notes || '',
            materials,
          });
        }
      }

      const courseData = {
        title: courseJson.title,
        description: courseJson.notes,
        department: courseJson.department,
        // instructorId is optional; backend will default to the authenticated user
        notes: courseJson.notes,
        pptLinks: courseJson.pptLinks,
        resources: courseJson.resources,
        // Combine any manual attachment links plus uploaded file urls and keep existing attachments not marked for deletion
        attachments: [
          ...(courseJson.attachments || []),
          ...uploadedUrls,
          ...existingAttachments.filter((u) => !removedExistingAttachments.includes(u)),
        ],
        // Flattened chapters derived from modules
        chapters: chaptersPayload,
        tags: courseJson.tags,
        estimatedDuration: courseJson.estimatedDuration,
        outline: courseJson.outline,
        instructorId: selectedFacilitator || undefined,
      };
      
      let res: any;
      if (initialCourse && (initialCourse._id || initialCourse.id)) {
        const id = initialCourse._id || initialCourse.id;
        res = await coursesApi.update(id, courseData);
        const updated = res;
        toast({ title: "Course updated", description: "Course was updated successfully." });
        onUpdated?.(updated);
      } else {
        res = await coursesApi.create(courseData);
        const newCourse = (res && (res as any).course) ? (res as any).course : res;
        toast({ title: "Course created", description: "Your course has been created successfully." });
        onCreated?.(newCourse);
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create course",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!initialCourse) return;
    // Prefill fields from initialCourse for edit mode
    try {
      setTitle(initialCourse.title || '');
      setDepartment(initialCourse.department || '');
      setNotes(initialCourse.notes || initialCourse.description || '');
      setPptLinks(Array.isArray(initialCourse.pptLinks) && initialCourse.pptLinks.length ? initialCourse.pptLinks : ['']);
      setResources(Array.isArray(initialCourse.resources) && initialCourse.resources.length ? initialCourse.resources : [{ url: '', label: '' }]);
  // Treat existing attachments (stored URLs) separately so we can show previews and allow removal
  setExistingAttachments(Array.isArray(initialCourse.attachments) && initialCourse.attachments.length ? initialCourse.attachments : []);
  setAttachments([]);
      setTags((initialCourse.tags || []).join ? (initialCourse.tags || []).join(',') : '');
      setEstimatedDuration(initialCourse.estimatedDuration || '');
      setOutline(Array.isArray(initialCourse.outline) && initialCourse.outline.length ? initialCourse.outline : [{ title: '', description: '' }]);

      // Map existing chapters to a single module for editing convenience
      if (Array.isArray(initialCourse.chapters)) {
        const mappedChapters = initialCourse.chapters.map((c: any) => {
          const existing = Array.isArray(c.materials) ? c.materials.filter((m: any) => m.type === 'file').map((m: any) => m.url) : [];
          return ({
            title: c.title || '',
            notes: c.description || '',
            files: existing,
            existingFiles: existing,
            removedExistingFiles: [],
            pptLinks: Array.isArray(c.materials) ? c.materials.filter((m: any) => m.type === 'ppt').map((m: any) => m.url) : [],
            _selectedFiles: []
          });
        });
        setModules([{ title: '', chapters: mappedChapters }]);
      }
    } catch (e) {
      // ignore prefill errors
    }
  }, [initialCourse]);

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

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* scrollable form area for dialogs */}
          <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
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
              <div className="mt-2">
                <Label>Upload Files</Label>
                <input type="file" multiple onChange={(e) => handleFilesSelected(e.target.files)} className="mt-1" />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedFiles.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <div className="text-sm">{f.name} <span className="text-xs text-muted-foreground ml-2">({Math.round(f.size/1024)} KB)</span></div>
                        <Button variant="ghost" size="icon" onClick={() => removeSelectedFile(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Existing course-level attachments (from server) */}
              {existingAttachments.length > 0 && (
                <div className="mt-4">
                  <Label>Existing Attachments</Label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {existingAttachments.map((url, idx) => {
                      const removed = removedExistingAttachments.includes(url);
                      const filename = url.split('/').pop() || url;
                      const isImage = /\.(png|jpe?g|gif|webp)$/i.test(filename);
                      const isPpt = /\.(pptx?|key)$/i.test(filename);
                      return (
                        <div key={idx} className={`p-2 border rounded flex items-center justify-between ${removed ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                              {isImage ? (
                                <img src={url} alt={filename} className="object-cover w-full h-full" />
                              ) : isPpt ? (
                                <FileIcon className="h-6 w-6" />
                              ) : (
                                <FileIcon className="h-6 w-6" />
                              )}
                            </div>
                            <div className="text-sm">
                              <a href={url} target="_blank" rel="noreferrer" className="underline">{filename}</a>
                              <div className="text-xs text-muted-foreground">{isImage ? 'Image' : isPpt ? 'Presentation' : 'File'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => window.open(url, '_blank')}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10 14l2-2 2 2"/></svg>
                            </Button>
                            <Button variant={removed ? 'secondary' : 'ghost'} size="icon" onClick={() => {
                              setRemovedExistingAttachments((prev) => prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]);
                            }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Modules</Label>
                <Button type="button" variant="outline" size="sm" onClick={addModule}>
                  <Plus className="mr-2 h-4 w-4" /> Add module
                </Button>
              </div>

              {modules.map((mod, mi) => (
                <div key={mi} className="border rounded p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <Input placeholder={`Module ${mi + 1} title`} value={mod.title} onChange={(e) => setModules((prev) => prev.map((m, i) => i === mi ? { ...m, title: e.target.value } : m))} />
                    <div className="flex items-center gap-2">
                      {modules.length > 1 && (
                        <Button type="button" variant="destructive" size="icon" onClick={() => removeModule(mi)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button type="button" variant="outline" size="sm" onClick={() => addChapter(mi)}>Add chapter</Button>
                    </div>
                  </div>

                  {mod.chapters.map((chap, ci) => (
                    <div key={ci} className="p-2 bg-surface rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <Input placeholder={`Chapter ${ci + 1} title`} value={chap.title} onChange={(e) => setModules((prev) => prev.map((m, i) => i === mi ? { ...m, chapters: m.chapters.map((c, ii) => ii === ci ? { ...c, title: e.target.value } : c) } : m))} />
                        <div className="flex items-center gap-2">
                          {mod.chapters.length > 1 && (
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeChapter(mi, ci)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea value={chap.notes} onChange={(e) => setModules((prev) => prev.map((m, i) => i === mi ? { ...m, chapters: m.chapters.map((c, ii) => ii === ci ? { ...c, notes: e.target.value } : c) } : m))} rows={3} />
                      </div>

                      <div>
                        <Label>Attach files (chapter)</Label>
                        <input type="file" multiple onChange={(e) => handleChapterFilesSelected(mi, ci, e.target.files)} className="mt-1" />

                        {/* Existing files (from the course). Allow mark-for-delete */}
                        {(chap.existingFiles || []).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {(chap.existingFiles || []).map((url, fidx) => {
                              const removed = (chap.removedExistingFiles || []).includes(url);
                              return (
                                <div key={fidx} className="flex items-center justify-between p-2 border rounded">
                                  <div className="text-sm">
                                    <a href={url} target="_blank" rel="noreferrer" className="underline">{url.split('/').pop()}</a>
                                    <span className="text-xs text-muted-foreground ml-2">({url})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => window.open(url, '_blank') }>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10 14l2-2 2 2"/></svg>
                                    </Button>
                                    <Button variant={removed ? 'secondary' : 'ghost'} size="icon" onClick={() => {
                                      setModules((prev) => prev.map((m, mi2) => {
                                        if (mi2 !== mi) return m;
                                        return { ...m, chapters: m.chapters.map((c, ci2) => {
                                          if (ci2 !== ci) return c;
                                          const removedSet = new Set(c.removedExistingFiles || []);
                                          if (removedSet.has(url)) removedSet.delete(url); else removedSet.add(url);
                                          return { ...c, removedExistingFiles: Array.from(removedSet) } as CourseChapter;
                                        }) };
                                      }));
                                    }}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Newly selected local files */}
                        {(chap._selectedFiles || []).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {(chap._selectedFiles || []).map((f, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 border rounded">
                                <div className="text-sm">{f.name} <span className="text-xs text-muted-foreground ml-2">({Math.round(f.size/1024)} KB)</span></div>
                                <Button variant="ghost" size="icon" onClick={() => removeChapterSelectedFile(mi, ci, idx)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>PPT Links (chapter)</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => addChapterPptLink(mi, ci)}>
                            <Plus className="mr-2 h-4 w-4" /> Add link
                          </Button>
                        </div>
                        {(chap.pptLinks || []).map((link, li) => (
                          <div key={li} className="flex gap-2">
                            <Input value={link} onChange={(e) => setModules((prev) => prev.map((m, i) => i === mi ? { ...m, chapters: m.chapters.map((c, ii) => ii === ci ? { ...c, pptLinks: (c.pptLinks || []).map((v, vi) => vi === li ? e.target.value : v) } : c) } : m))} placeholder="https://..." />
                            {(chap.pptLinks || []).length > 1 && (
                              <Button type="button" variant="destructive" size="icon" onClick={() => removeChapterPptLink(mi, ci, li)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
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
              <Button type="button" variant="outline" onClick={handleSubmit}>Save</Button>
              <Button type="button" onClick={handleSubmit} data-testid="button-submit-course">Create Course</Button>
              {/* If course already exists (in editing mode) we could call handleEnrollExisting(courseId) */}
            </div>
          </div>
        </CardContent>
      </Card>

      
    </div>
  );
}


