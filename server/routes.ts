import type { Express } from "express";
import { createServer, type Server } from "http";
import { Router } from "express";
import { 
  User, Course, Assignment, Submission, Grade, Announcement, Enrollment 
} from "./mongodb";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = Router();

  // Authentication middleware (simplified for demo)
  const authenticate = (req: any, res: any, next: any) => {
    // In a real app, you'd verify JWT tokens or session
    req.user = { id: "demo-user", role: "student" }; // Default for demo
    next();
  };

  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };

  // Users routes
  router.get("/users", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const allUsers = await User.find().select('-password');
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  router.post("/users", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const newUser = new User(req.body);
      await newUser.save();
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Courses routes
  router.get("/courses", authenticate, async (req, res) => {
    try {
      const allCourses = await Course.find({ isActive: true }).populate('instructorId', 'fullName');
      res.json(allCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  router.post("/courses", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    try {
      const newCourse = new Course(req.body);
      await newCourse.save();
      await newCourse.populate('instructorId', 'fullName');
      res.json(newCourse);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  router.get("/courses/:id", authenticate, async (req, res) => {
    try {
      const course = await Course.findById(req.params.id).populate('instructorId', 'fullName');
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  // Assignments routes
  router.get("/assignments", authenticate, async (req, res) => {
    try {
      const { courseId } = req.query;
      let query = { isActive: true };
      
      if (courseId) {
        query = { ...query, courseId };
      }
      
      const allAssignments = await Assignment.find(query).populate('courseId', 'title');
      res.json(allAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  router.post("/assignments", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    try {
      const newAssignment = new Assignment(req.body);
      await newAssignment.save();
      await newAssignment.populate('courseId', 'title');
      res.json(newAssignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  router.put("/assignments/:id", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    try {
      const { dueDate } = req.body;
      const updatedAssignment = await Assignment.findByIdAndUpdate(
        req.params.id,
        { dueDate },
        { new: true }
      );
      
      if (!updatedAssignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      res.json(updatedAssignment);
    } catch (error) {
      console.error("Error updating assignment:", error);
      res.status(500).json({ error: "Failed to update assignment" });
    }
  });

  // Submissions routes
  router.get("/submissions", authenticate, async (req, res) => {
    try {
      const { assignmentId, studentId } = req.query;
      let query: any = {};
      
      if (assignmentId) {
        query.assignmentId = assignmentId;
      }
      if (studentId) {
        query.studentId = studentId;
      }
      
      const allSubmissions = await Submission.find(query)
        .populate('assignmentId', 'title')
        .populate('studentId', 'fullName');
      res.json(allSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  router.post("/submissions", authenticate, requireRole(["student"]), async (req, res) => {
    try {
      const newSubmission = new Submission(req.body);
      await newSubmission.save();
      
      // Auto-grade if assignment type is "auto"
      const assignment = await Assignment.findById(req.body.assignmentId);
      if (assignment && assignment.type === "auto") {
        // Simple auto-grading logic
        const score = Object.values(req.body.answers || {}).filter((answer: any) => answer.trim()).length;
        const newGrade = new Grade({
          assignmentId: req.body.assignmentId,
          studentId: req.body.studentId,
          score,
          maxScore: assignment.maxScore || 100,
          status: "graded",
          gradedAt: new Date(),
        });
        await newGrade.save();
      }
      
      res.json(newSubmission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ error: "Failed to create submission" });
    }
  });

  // Grades routes
  router.get("/grades", authenticate, async (req, res) => {
    try {
      const { studentId, assignmentId } = req.query;
      let query: any = {};
      
      if (studentId) {
        query.studentId = studentId;
      }
      if (assignmentId) {
        query.assignmentId = assignmentId;
      }
      
      const allGrades = await Grade.find(query)
        .populate('assignmentId', 'title')
        .populate('studentId', 'fullName')
        .populate('gradedBy', 'fullName');
      res.json(allGrades);
    } catch (error) {
      console.error("Error fetching grades:", error);
      res.status(500).json({ error: "Failed to fetch grades" });
    }
  });

  router.put("/grades/:id", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    try {
      const { manualScore, feedback } = req.body;
      const updatedGrade = await Grade.findByIdAndUpdate(
        req.params.id,
        { 
          manualScore, 
          feedback, 
          status: "graded",
          gradedBy: req.user.id,
          gradedAt: new Date()
        },
        { new: true }
      );
      
      if (!updatedGrade) {
        return res.status(404).json({ error: "Grade not found" });
      }
      
      res.json(updatedGrade);
    } catch (error) {
      console.error("Error updating grade:", error);
      res.status(500).json({ error: "Failed to update grade" });
    }
  });

  // Announcements routes
  router.get("/announcements", authenticate, async (req, res) => {
    try {
      const { courseId, isGlobal } = req.query;
      let query: any = {};
      
      if (courseId) {
        query.courseId = courseId;
      }
      if (isGlobal === "true") {
        query.isGlobal = true;
      }
      
      const allAnnouncements = await Announcement.find(query)
        .populate('authorId', 'fullName')
        .populate('courseId', 'title')
        .sort({ createdAt: -1 });
      res.json(allAnnouncements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  router.post("/announcements", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    try {
      const newAnnouncement = new Announcement(req.body);
      await newAnnouncement.save();
      await newAnnouncement.populate('authorId', 'fullName');
      res.json(newAnnouncement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  // Course enrollments
  router.post("/enrollments", authenticate, requireRole(["student"]), async (req, res) => {
    try {
      const { courseId } = req.body;
      const enrollment = new Enrollment({
        courseId,
        studentId: req.user.id,
      });
      await enrollment.save();
      res.json(enrollment);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      res.status(500).json({ error: "Failed to enroll in course" });
    }
  });

  // Admin dashboard data
  router.get("/admin/dashboard", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const userCount = await User.countDocuments();
      const courseCount = await Course.countDocuments();
      const assignmentCount = await Assignment.countDocuments();
      const submissionCount = await Submission.countDocuments();
      
      res.json({
        users: userCount,
        courses: courseCount,
        assignments: assignmentCount,
        submissions: submissionCount,
      });
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
