import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, BookOpen, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { coursesApi } from "@/lib/api";

interface AddCourseDialogProps {
  onCourseAdded?: () => void;
}

export function AddCourseDialog({ onCourseAdded }: AddCourseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    instructorId: '',
    thumbnail: '',
    notes: '',
    estimatedDuration: '',
    tags: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Convert tags string to array
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];

      const courseData = {
        ...formData,
        tags: tagsArray,
        // The server will generate the enrollment key automatically
      };

      // Ensure user is authenticated before calling API
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        toast({
          title: "Not authenticated",
          description: "You must be logged in as a tutor or admin to add courses.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      try {
        // use centralized API helper which attaches auth headers
        const newCourse: any = await coursesApi.create({
          ...courseData,
        });

        toast({
          title: "Course Created Successfully",
          description: `${formData.title} has been created with enrollment key: ${newCourse.enrollmentKey}`,
        });
        setIsOpen(false);
        setFormData({
          title: '',
          description: '',
          department: '',
          instructorId: '',
          thumbnail: '',
          notes: '',
          estimatedDuration: '',
          tags: '',
        });
        onCourseAdded?.();
      } catch (err: any) {
        const message = err?.message || 'Failed to create course';
        toast({
          title: "Error Creating Course",
          description: message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error Creating Course",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-course">
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Create New Course
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              placeholder="Enter course title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter course description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g., Technology"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Duration</Label>
              <Input
                id="estimatedDuration"
                placeholder="e.g., 12 weeks"
                value={formData.estimatedDuration}
                onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructorId">Instructor ID</Label>
            <Input
              id="instructorId"
              placeholder="Enter instructor user ID (optional)"
              value={formData.instructorId}
              onChange={(e) => handleInputChange('instructorId', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter the user ID of the instructor who will teach this course (leave empty to set yourself)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail URL</Label>
            <Input
              id="thumbnail"
              placeholder="Enter thumbnail image URL"
              value={formData.thumbnail}
              onChange={(e) => handleInputChange('thumbnail', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Course Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional course notes or requirements"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Enter tags separated by commas (e.g., programming, beginner, web)"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Users className="h-4 w-4" />
              <span className="font-medium">Enrollment Key</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              An enrollment key will be automatically generated for this course. Students will need this key to enroll.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
