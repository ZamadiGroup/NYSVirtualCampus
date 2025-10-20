import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MaterialCard } from "@/components/MaterialCard";
import { AssignmentCard } from "@/components/AssignmentCard";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { BookOpen, Users, Clock, Award } from "lucide-react";
import techThumbnail from "@assets/generated_images/Technology_course_thumbnail_5e4c2c8c.png";

export default function CourseDetail() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="relative h-48 rounded-lg overflow-hidden">
        <img
          src={techThumbnail}
          alt="Course banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <Badge className="mb-2 bg-primary">Technology</Badge>
          <h1 className="text-3xl font-bold" data-testid="text-course-title">
            Introduction to Computer Science
          </h1>
          <p className="text-sm mt-1 opacity-90">Taught by Dr. Sarah Kamau</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">145</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-chart-3/10 text-chart-3">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">65%</p>
                <p className="text-sm text-muted-foreground">Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-chart-2/10 text-chart-2">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Materials</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-sm text-muted-foreground">Avg. Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Completion</span>
            <span className="font-medium">65%</span>
          </div>
          <Progress value={65} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList>
          <TabsTrigger value="materials" data-testid="tab-materials">
            Materials
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            Assignments
          </TabsTrigger>
          <TabsTrigger value="announcements" data-testid="tab-announcements">
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-3">
          <MaterialCard
            id="1"
            title="Introduction to Databases - Lecture Notes.pdf"
            type="pdf"
            size="2.4 MB"
            uploadedAt={today}
            onDownload={() => console.log("Download material")}
            onView={() => console.log("View material")}
          />
          <MaterialCard
            id="2"
            title="Database Normalization Tutorial Video"
            type="video"
            size="45 MB"
            uploadedAt={today}
            onDownload={() => console.log("Download material")}
            onView={() => console.log("View material")}
          />
          <MaterialCard
            id="3"
            title="SQL Practice Exercises - External Resource"
            type="link"
            uploadedAt={today}
            onView={() => console.log("Open link")}
          />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AssignmentCard
              id="1"
              title="Database Design Project"
              courseName="Introduction to Computer Science"
              dueDate={tomorrow}
              status="pending"
              onSubmit={() => console.log("Submit assignment")}
            />
            <AssignmentCard
              id="2"
              title="SQL Query Optimization"
              courseName="Introduction to Computer Science"
              dueDate={today}
              status="graded"
              grade={92}
              onView={() => console.log("View submission")}
            />
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <div className="max-w-3xl space-y-4">
            <AnnouncementCard
              id="1"
              title="Mid-Semester Exam Schedule Released"
              content="The mid-semester examination timetable has been published. Please check your course pages for specific dates and venues."
              courseName="Introduction to Computer Science"
              postedBy="Dr. Sarah Kamau"
              postedAt={today}
              priority="important"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
