import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function CreateCoursePage() {
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState({
    title: "",
    notes: "",
    assignedStudents: "",
    pptLink: "",
    department: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log("Created Course JSON:", JSON.stringify(courseData, null, 2));
    alert("Course created successfully!");
    navigate("/tutor-dashboard");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              name="title"
              value={courseData.title}
              onChange={handleChange}
              placeholder="e.g. Advanced AI Techniques"
            />
          </div>

          <div>
            <Label htmlFor="notes">Course Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={courseData.notes}
              onChange={handleChange}
              placeholder="Brief description or notes..."
            />
          </div>

          <div>
            <Label htmlFor="assignedStudents">Assigned Students</Label>
            <Input
              id="assignedStudents"
              name="assignedStudents"
              value={courseData.assignedStudents}
              onChange={handleChange}
              placeholder="Comma-separated student names or IDs"
            />
          </div>

          <div>
            <Label htmlFor="pptLink">PPT / Resource Link</Label>
            <Input
              id="pptLink"
              name="pptLink"
              value={courseData.pptLink}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              name="department"
              value={courseData.department}
              onChange={handleChange}
              placeholder="e.g. Technology, Business..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => navigate("/tutor-dashboard")}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} data-testid="button-submit-course">
              Create Course
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
