import type { Express } from "express";
import { createServer, type Server } from "http";
import { Router, type Response } from "express";
import { 
  User, Course, Assignment, Submission, Grade, Announcement, Enrollment 
} from "./mongodb";
import { 
  generateToken, 
  verifyToken, 
  extractTokenFromHeader, 
  type AuthenticatedRequest,
  type JWTPayload 
} from "./jwt";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = Router();

  // JWT Authentication middleware
  const authenticate = (req: AuthenticatedRequest, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      const token = extractTokenFromHeader(authHeader);
      
      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: "Invalid token" });
      }

      req.user = decoded;
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(401).json({ error: "Authentication failed" });
    }
  };

  const requireRole = (roles: string[]) => (req: AuthenticatedRequest, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };

  // Authentication routes
  router.post("/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // In a real app, you'd verify the password hash
      // For demo purposes, we'll just check if password matches
      if (user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token
      const token = generateToken({
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
        fullName: user.fullName
      });

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  router.post("/auth/register", async (req, res) => {
    try {
      const { email, password, fullName, role = "student" } = req.body;
      
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: "Email, password, and full name are required" });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Create new user
      const newUser = new User({
        email,
        password, // In production, hash this password
        fullName,
        role
      });

      await newUser.save();

      // Generate JWT token
      const token = generateToken({
        userId: newUser._id.toString(),
        role: newUser.role,
        email: newUser.email,
        fullName: newUser.fullName
      });

      res.status(201).json({
        token,
        user: {
          id: newUser._id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Users routes
  router.get("/users", authenticate, requireRole(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allUsers = await User.find().select('-password');
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  router.post("/users", authenticate, requireRole(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
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
  router.get("/courses", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allCourses = await Course.find({ isActive: true }).populate('instructorId', 'fullName');
      res.json(allCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  router.post("/courses", authenticate, requireRole(["tutor", "admin"]), async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Generate a unique enrollment key
      const enrollmentKey = nanoid(8).toUpperCase();
      
      const newCourse = new Course({
        ...req.body,
        enrollmentKey
      });
      await newCourse.save();
      await newCourse.populate('instructorId', 'fullName');
      res.json(newCourse);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  router.get("/courses/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const course = await Course.findById(req.params.id).populate('instructorId', 'fullName');
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      // Only show enrollment key to tutors and admins
      const response = course.toObject();
      if (req.user.role !== 'student') {
        response.enrollmentKey = course.enrollmentKey;
      } else {
        delete response.enrollmentKey;
      }
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  // Generate new enrollment key for a course
  router.post("/courses/:id/regenerate-key", authenticate, requireRole(["tutor", "admin"]), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Check if the user is the instructor or admin
      if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user.userId) {
        return res.status(403).json({ error: "Only the course instructor or admin can regenerate the key" });
      }

      const newEnrollmentKey = nanoid(8).toUpperCase();
      course.enrollmentKey = newEnrollmentKey;
      await course.save();

      res.json({ enrollmentKey: newEnrollmentKey });
    } catch (error) {
      console.error("Error regenerating enrollment key:", error);
      res.status(500).json({ error: "Failed to regenerate enrollment key" });
    }
  });

  // Assignments routes
  router.get("/assignments", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { courseId } = req.query;
      let query = { isActive: true };
      
      if (courseId) {
        query = { ...query, courseId: courseId as string } as any;
      }
      
      const allAssignments = await Assignment.find(query).populate('courseId', 'title');
      res.json(allAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  router.post("/assignments", authenticate, requireRole(["tutor", "admin"]), async (req: AuthenticatedRequest, res: Response) => {
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

  router.put("/assignments/:id", authenticate, requireRole(["tutor", "admin"]), async (req: AuthenticatedRequest, res: Response) => {
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
  router.get("/submissions", authenticate, async (req: AuthenticatedRequest, res: Response) => {
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

  router.post("/submissions", authenticate, requireRole(["student"]), async (req: AuthenticatedRequest, res: Response) => {
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
  router.get("/grades", authenticate, async (req: AuthenticatedRequest, res: Response) => {
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

  router.put("/grades/:id", authenticate, requireRole(["tutor", "admin"]), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { manualScore, feedback } = req.body;
      const updatedGrade = await Grade.findByIdAndUpdate(
        req.params.id,
        { 
          manualScore, 
          feedback, 
          status: "graded",
          gradedBy: req.user.userId,
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
  router.get("/announcements", authenticate, async (req: AuthenticatedRequest, res: Response) => {
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

  router.post("/announcements", authenticate, requireRole(["tutor", "admin"]), async (req: AuthenticatedRequest, res: Response) => {
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
  router.post("/enrollments", authenticate, requireRole(["student"]), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { courseId, enrollmentKey } = req.body;
      
      if (!courseId || !enrollmentKey) {
        return res.status(400).json({ error: "Course ID and enrollment key are required" });
      }

      // Find the course and verify the enrollment key
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      if (course.enrollmentKey !== enrollmentKey) {
        return res.status(400).json({ error: "Invalid enrollment key" });
      }

      // Check if student is already enrolled
      const existingEnrollment = await Enrollment.findOne({
        courseId,
        studentId: req.user.userId
      });

      if (existingEnrollment) {
        return res.status(400).json({ error: "Already enrolled in this course" });
      }

      const enrollment = new Enrollment({
        courseId,
        studentId: req.user.userId,
      });
      await enrollment.save();
      res.json(enrollment);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      res.status(500).json({ error: "Failed to enroll in course" });
    }
  });

  // Admin dashboard data
  router.get("/admin/dashboard", authenticate, requireRole(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
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
