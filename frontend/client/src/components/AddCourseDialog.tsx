import React, { useState, useRef } from "react";
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
import { Plus, BookOpen, Users, Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { coursesApi } from "@/lib/api";

interface AddCourseDialogProps {
  onCourseAdded?: () => void;
}

export function AddCourseDialog({ onCourseAdded }: AddCourseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department: "",
    thumbnail: "",
    notes: "",
    estimatedDuration: "",
    duration: "",
    isMandatory: true,
    tags: "",
  });

  type FormData = typeof formData;
  const handleInputChange = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (jpg, png, gif, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];

        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Not authenticated",
            description: "Please log in to upload images.",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }

        try {
          const response = await fetch("/api/uploads", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              filename: file.name,
              contentBase64: base64,
            }),
          });

          if (!response.ok) {
            throw new Error("Upload failed");
          }

          const data = await response.json();
          setFormData((prev) => ({ ...prev, thumbnail: data.url }));
          setImagePreview(data.url);
          toast({
            title: "Image uploaded",
            description: "Thumbnail image uploaded successfully.",
          });
        } catch (err) {
          console.error("Upload error:", err);
          toast({
            title: "Upload failed",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        toast({
          title: "Error reading file",
          description: "Failed to read the image file.",
          variant: "destructive",
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Image upload error:", error);
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, thumbnail: "" }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!formData.title?.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a course title.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.department?.trim()) {
      toast({
        title: "Missing department",
        description: "Please select or enter a department.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Convert tags string to array
      const tagsArray = formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [];

      const courseData = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        isMandatory: formData.isMandatory,
        tags: tagsArray,
        // The server will set instructorId to the authenticated user
      };

      // Ensure user is authenticated before calling API
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast({
          title: "Not authenticated",
          description:
            "You must be logged in as a tutor or admin to add courses.",
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

        // Handle both direct response and wrapped response formats
        const course = newCourse.course || newCourse;
        const enrollmentKey = course.enrollmentKey || newCourse.enrollmentKey;

        toast({
          title: "Course Created Successfully",
          description: `${formData.title} has been created with enrollment key: ${enrollmentKey}`,
        });
        setIsOpen(false);
        setFormData({
          title: "",
          description: "",
          department: "",
          thumbnail: "",
          notes: "",
          estimatedDuration: "",
          duration: "",
          isMandatory: true,
          tags: "",
        });
        setImagePreview(null);
        onCourseAdded?.();
      } catch (err: any) {
        console.error("Course creation error:", err);
        const message =
          err?.message || "Failed to create course. Please try again.";
        toast({
          title: "Error Creating Course",
          description: message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating course:", error);
      toast({
        title: "Error Creating Course",
        description:
          "Network error. Please check your connection and try again.",
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
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter course description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
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
                onChange={(e) =>
                  handleInputChange("department", e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Estimated Duration</Label>
              <Input
                id="estimatedDuration"
                placeholder="e.g., 12 weeks"
                value={formData.estimatedDuration}
                onChange={(e) =>
                  handleInputChange("estimatedDuration", e.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (Hours)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="e.g., 40"
              value={formData.duration}
              onChange={(e) => handleInputChange("duration", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Total hours for this course
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="isMandatory"
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                id="isMandatory"
                type="checkbox"
                checked={formData.isMandatory}
                onChange={(e) =>
                  handleInputChange("isMandatory", e.target.checked)
                }
              />
              All students must join this course (Mandatory)
            </Label>
            <p className="text-xs text-muted-foreground">
              If checked, all students will be auto-enrolled in this course
            </p>
          </div>

          <div className="space-y-2">
            <Label>Course Thumbnail</Label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Thumbnail preview"
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 rounded-md p-4 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    {isUploading
                      ? "Uploading..."
                      : "Click to upload thumbnail image"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, GIF up to 5MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Course Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional course notes or requirements"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Enter tags separated by commas (e.g., programming, beginner, web)"
              value={formData.tags}
              onChange={(e) => handleInputChange("tags", e.target.value)}
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
              An enrollment key will be automatically generated for this course.
              Students will need this key to enroll.
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
