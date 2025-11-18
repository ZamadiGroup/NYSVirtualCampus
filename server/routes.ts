import type { Express, NextFunction, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { Router, type Response } from "express";
import mongoose from 'mongoose';
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
import bcrypt from 'bcrypt';
import { nanoid } from "nanoid";
import fs from 'fs';

export async function registerRoutes(app: Express): Promise<Server> {
  const router = Router();

  // JWT Authentication middleware
  const authenticate: RequestHandler = (req, res, next) => {
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

      (req as AuthenticatedRequest).user = decoded;
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(401).json({ error: "Authentication failed" });
    }
  };

  const requireRole = (roles: string[]): RequestHandler => (req, res, next) => {
    const authReq = req as AuthenticatedRequest;
    if (!roles.includes(authReq.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };

  // Health check endpoint
  router.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
  });

  // Authentication routes
  router.post("/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Check if database is connected
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not available" });
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password using bcrypt if stored as a hash, otherwise compare directly (backwards compat)
      let passwordMatches = false;
      try {
        if (typeof user.password === 'string' && user.password.startsWith('$2')) {
          passwordMatches = await bcrypt.compare(password, user.password);
        } else {
          passwordMatches = user.password === password;
        }
      } catch (e) {
        console.error('Password compare failed', e);
      }
      if (!passwordMatches) {
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
      const { email, password, fullName } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({ error: "Email, password, and full name are required" });
      }

      // For public registration we do NOT allow creating admin accounts.
      // However, we allow registering as 'student' or 'tutor' from the public form.
      // Admin accounts must still be created via the protected /users endpoint.
      const requestedRole = req.body.role;
      const role = requestedRole === 'tutor' ? 'tutor' : 'student';

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Ensure username exists for schema requirements. Derive from email if not provided.
      const username = req.body.username || (email.includes('@') ? email.split('@')[0] : email);

      // Create new user with enforced role
      const hashed = await bcrypt.hash(password, 10);
      const newUser = new User({
        username,
        email,
        password: hashed,
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
  router.get("/users", authenticate, requireRole(["admin"]), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const roleFilter = (req.query.role as string) || undefined;
      const query: any = {};
      if (roleFilter) query.role = roleFilter;
      const allUsers = await User.find(query).select('-password');
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Allow tutors and admins to fetch all students specifically
  router.get('/users/students', authenticate, requireRole(['tutor','admin']), async (req, res) => {
    try {
      const students = await User.find({ role: 'student' }).select('-password');
      res.json(students);
    } catch (err) {
      console.error('Error fetching students for tutors:', err);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });

  router.post("/users", authenticate, requireRole(["admin"]), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const payload: any = { ...req.body };
      if (payload.password) {
        payload.password = await bcrypt.hash(payload.password, 10);
      }
      const newUser = new User(payload);
      await newUser.save();
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Courses routes
  router.get("/courses", authenticate, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      // Students should only see courses they're enrolled in
      if (authReq.user.role === 'student') {
        const enrollments = await Enrollment.find({ studentId: authReq.user.userId }).select('courseId');
        const courseIds = enrollments.map((e) => e.courseId);
        const courses = await Course.find({ _id: { $in: courseIds }, isActive: true }).populate('instructorId', 'fullName');
        
        // Add enrollment count to each course
        const coursesWithCount = await Promise.all(courses.map(async (course) => {
          const enrollCount = await Enrollment.countDocuments({ courseId: course._id });
          return { ...course.toObject(), enrolledCount: enrollCount };
        }));
        
        return res.json(coursesWithCount);
      }

      // Tutors and admins see all active courses with enrollment counts
      const allCourses = await Course.find({ isActive: true }).populate('instructorId', 'fullName');
      
      // Add enrollment count to each course
      const coursesWithCount = await Promise.all(allCourses.map(async (course) => {
        const enrollCount = await Enrollment.countDocuments({ courseId: course._id });
        return { ...course.toObject(), enrolledCount: enrollCount };
      }));
      
      res.json(coursesWithCount);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  // Courses assigned to the authenticated facilitator (tutor)
  router.get('/courses/my', authenticate, requireRole(['tutor','admin']), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const courses = await Course.find({ instructorId: authReq.user.userId, isActive: true }).populate('instructorId', 'fullName');
      res.json(courses);
    } catch (err) {
      console.error('Error fetching my courses', err);
      res.status(500).json({ error: 'Failed to fetch my courses' });
    }
  });

  // Courses available to a student (not enrolled yet)
  router.get('/courses/available', authenticate, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      if (authReq.user.role === 'student') {
        const enrollments = await Enrollment.find({ studentId: authReq.user.userId }).select('courseId');
        const courseIds = enrollments.map((e) => e.courseId);
        const available = await Course.find({ _id: { $nin: courseIds }, isActive: true }).populate('instructorId', 'fullName');
        return res.json(available);
      }
      // tutors/admins see all active courses as available
      const all = await Course.find({ isActive: true }).populate('instructorId', 'fullName');
      res.json(all);
    } catch (err) {
      console.error('Error fetching available courses', err);
      res.status(500).json({ error: 'Failed to fetch available courses' });
    }
  });

  router.post("/courses", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      // Generate a unique enrollment key
      const enrollmentKey = nanoid(8).toUpperCase();

      const authReq = req as AuthenticatedRequest;
      // Default instructorId to the authenticated user if not provided
      const instructorId = req.body.instructorId || authReq.user.userId;

      // Persist enrollEmails if provided
      const coursePayload: any = {
        ...req.body,
        instructorId,
        enrollmentKey,
      };

      if (Array.isArray(req.body.enrollEmails)) {
        coursePayload.enrollEmails = req.body.enrollEmails.filter((e: any) => typeof e === 'string' && e.includes('@'));
      }

      const newCourse = new Course(coursePayload);
      await newCourse.save();
      await newCourse.populate('instructorId', 'fullName');

      // If enrollEmails provided, try to create enrollments for existing student users
      const enrollResults: { processed: string[]; skipped: string[]; notFound: string[] } = { processed: [], skipped: [], notFound: [] };
      if (Array.isArray(coursePayload.enrollEmails) && coursePayload.enrollEmails.length) {
        for (const em of coursePayload.enrollEmails) {
          try {
            const user = await User.findOne({ email: em });
            if (!user) {
                // Create an invited placeholder student account so we can track the invite
                try {
                  const inviteToken = nanoid(12);
                  const baseName = (em.split('@')[0] || 'invited').replace(/[^a-zA-Z0-9._-]/g, '_');
                  let username = `${baseName}_inv`;
                  // Ensure username uniqueness
                  let suffix = 0;
                  while (await User.findOne({ username })) {
                    suffix += 1;
                    username = `${baseName}_inv${suffix}`;
                  }

                  const placeholder = new User({
                    username,
                    password: await bcrypt.hash(nanoid(10), 10), // random hashed password until claimed
                    email: em,
                    fullName: 'Invited Student',
                    role: 'student',
                    isInvited: true,
                    inviteToken,
                  });
                  await placeholder.save();

                  // auto-enroll the invited student
                  const enrollment = new Enrollment({ courseId: newCourse._id, studentId: placeholder._id });
                  await enrollment.save();
                  enrollResults.processed.push(em);
                } catch (ie) {
                  console.error('Failed to create invited placeholder for', em, ie);
                  enrollResults.notFound.push(em);
                }
                continue;
            }

            // Only students can be auto-enrolled here
            if (user.role !== 'student') {
              enrollResults.skipped.push(em);
              continue;
            }

            // Avoid duplicate enrollments
            const existing = await Enrollment.findOne({ courseId: newCourse._id, studentId: user._id });
            if (existing) {
              enrollResults.skipped.push(em);
              continue;
            }

            const enrollment = new Enrollment({ courseId: newCourse._id, studentId: user._id });
            await enrollment.save();
            enrollResults.processed.push(em);
          } catch (e) {
            console.error('Error processing enrollEmail', em, e);
            enrollResults.skipped.push(em);
          }
        }
      }

      res.json({ course: newCourse, enrollments: enrollResults });
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  // File upload via base64 (simple demo endpoint) — accepts { filename, contentBase64 }
  router.post('/uploads', authenticate, requireRole(['tutor','admin']), async (req, res) => {
    try {
      const { filename, contentBase64 } = req.body;
      if (!filename || !contentBase64) return res.status(400).json({ error: 'filename and contentBase64 required' });

      // sanitize filename
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uploadsDir = new URL('../attached_assets/uploads', import.meta.url).pathname;
      const filePath = `${uploadsDir}/${Date.now()}_${safeName}`;
      const buffer = Buffer.from(contentBase64, 'base64');
      await fs.promises.writeFile(filePath, buffer);

      // return a URL relative to server's /uploads static route
      const urlPath = `/uploads/${filePath.split('/').slice(-1)[0]}`;
      res.json({ url: urlPath });
    } catch (err) {
      console.error('upload error', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  // Update a course (tutor or admin)
  router.put("/courses/:id", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ error: "Course not found" });

      // If tutor, ensure they are the instructor of this course
      if (authReq.user.role === 'tutor' && course.instructorId.toString() !== authReq.user.userId) {
        return res.status(403).json({ error: "Only the course instructor or admin can update the course" });
      }

      // Allow updating of specific fields including instructorId
      const updatable = [
        'title', 'description', 'department', 'notes', 'pptLinks', 'resources', 'attachments', 'tags', 'estimatedDuration', 'outline', 'chapters', 'thumbnail', 'isActive', 'instructorId'
      ];

      updatable.forEach((key) => {
        if (req.body[key] !== undefined) {
          (course as any)[key] = req.body[key];
        }
      });

      await course.save();
      await course.populate('instructorId', 'fullName');
      res.json(course);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  // Delete a course (tutor or admin) - tutor must be instructor
  router.delete('/courses/:id', authenticate, requireRole(['tutor','admin']), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ error: 'Course not found' });

      if (authReq.user.role !== 'admin' && course.instructorId.toString() !== authReq.user.userId) {
        return res.status(403).json({ error: 'Only the instructor or admin may delete this course' });
      }

      await Course.findByIdAndDelete(req.params.id);
      // Optionally remove related enrollments, assignments
      await Enrollment.deleteMany({ courseId: req.params.id });
      await Assignment.deleteMany({ courseId: req.params.id });
      res.json({ success: true });
    } catch (err) {
      console.error('Failed to delete course', err);
      res.status(500).json({ error: 'Failed to delete course' });
    }
  });

  // Enroll students into an existing course by email (tutor or admin)
  router.post('/courses/:id/enroll', authenticate, requireRole(['tutor','admin']), async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ error: 'Course not found' });

      // Only instructor or admin may add enrollments
      const authReq = req as AuthenticatedRequest;
      if (authReq.user.role !== 'admin' && course.instructorId.toString() !== authReq.user.userId) {
        return res.status(403).json({ error: 'Only the instructor or admin may enroll students' });
      }

      const { enrollEmails } = req.body;
      if (!Array.isArray(enrollEmails) || enrollEmails.length === 0) return res.status(400).json({ error: 'enrollEmails array required' });

      const enrollResults: { processed: string[]; skipped: string[]; notFound: string[] } = { processed: [], skipped: [], notFound: [] };

      // ensure course document stores these emails
      course.enrollEmails = Array.from(new Set([...(course.enrollEmails || []), ...enrollEmails.filter((e: any) => typeof e === 'string')]));
      await course.save();

      for (const em of enrollEmails) {
        try {
          const user = await User.findOne({ email: em });
          if (!user) {
            // create invited placeholder student account
            try {
              const inviteToken = nanoid(12);
              const baseName = (em.split('@')[0] || 'invited').replace(/[^a-zA-Z0-9._-]/g, '_');
              let username = `${baseName}_inv`;
              let suffix = 0;
              while (await User.findOne({ username })) {
                suffix += 1;
                username = `${baseName}_inv${suffix}`;
              }
              const placeholder = new User({
                username,
                password: await bcrypt.hash(nanoid(10), 10),
                email: em,
                fullName: 'Invited Student',
                role: 'student',
                isInvited: true,
                inviteToken,
              });
              await placeholder.save();

              const enrollment = new Enrollment({ courseId: course._id, studentId: placeholder._id });
              await enrollment.save();
              enrollResults.processed.push(em);
            } catch (ie) {
              console.error('Failed to create invited placeholder for', em, ie);
              enrollResults.notFound.push(em);
            }
            continue;
          }
          if (user.role !== 'student') {
            enrollResults.skipped.push(em);
            continue;
          }
          const existing = await Enrollment.findOne({ courseId: course._id, studentId: user._id });
          if (existing) {
            enrollResults.skipped.push(em);
            continue;
          }
          const enrollment = new Enrollment({ courseId: course._id, studentId: user._id });
          await enrollment.save();
          enrollResults.processed.push(em);
        } catch (e) {
          console.error('Error processing enrollEmail', em, e);
          enrollResults.skipped.push(em);
        }
      }

      // Refresh course with enrollment count
      const enrollCount = await Enrollment.countDocuments({ courseId: course._id });
      const updatedCourse = await Course.findById(course._id).populate('instructorId', 'fullName');
      
      res.json({ course: { ...updatedCourse?.toObject(), enrolledCount: enrollCount }, enrollments: enrollResults });
    } catch (err) {
      console.error('Error enrolling students', err);
      res.status(500).json({ error: 'Failed to enroll students' });
    }
  });

  // Get enrolled students for a course
  router.get('/courses/:id/students', authenticate, requireRole(['tutor','admin']), async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ error: 'Course not found' });

      // Only instructor or admin can view enrolled students
      const authReq = req as AuthenticatedRequest;
      if (authReq.user.role !== 'admin' && course.instructorId.toString() !== authReq.user.userId) {
        return res.status(403).json({ error: 'Only the instructor or admin may view enrolled students' });
      }

      const enrollments = await Enrollment.find({ courseId: req.params.id }).populate('studentId', 'fullName email');
      const students = enrollments.map(e => e.studentId);
      
      res.json({ students, count: students.length });
    } catch (err) {
      console.error('Error fetching enrolled students', err);
      res.status(500).json({ error: 'Failed to fetch enrolled students' });
    }
  });

  // Bulk transfer students from one course to another (tutor or admin)
  router.post('/courses/bulk-transfer', authenticate, requireRole(['tutor','admin']), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { fromCourseId, toCourseId, studentIds } = req.body as { fromCourseId?: string; toCourseId?: string; studentIds?: string[] };
      if (!fromCourseId || !toCourseId || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ error: 'fromCourseId, toCourseId and studentIds[] are required' });
      }

      const fromCourse = await Course.findById(fromCourseId);
      const toCourse = await Course.findById(toCourseId);
      if (!fromCourse || !toCourse) return res.status(404).json({ error: 'Course not found' });

      // Optionally enforce that tutors must be instructor of at least one of the courses
      if (authReq.user.role !== 'admin') {
        const isInstructorOfFrom = fromCourse.instructorId.toString() === authReq.user.userId;
        const isInstructorOfTo = toCourse.instructorId.toString() === authReq.user.userId;
        if (!isInstructorOfFrom && !isInstructorOfTo) {
          // If the tutor isn't instructor of either course, deny for safety
          return res.status(403).json({ error: 'Tutors may only transfer students between courses they instruct' });
        }
      }

      const results: { transferred: string[]; skipped: string[]; errors: string[] } = { transferred: [], skipped: [], errors: [] };

      for (const sid of studentIds) {
        try {
          const student = await User.findById(sid);
          if (!student) {
            results.errors.push(sid);
            continue;
          }

          // Remove enrollment from source if exists
          await Enrollment.deleteMany({ courseId: fromCourseId, studentId: student._id });

          // Create enrollment in destination if not exists
          const existing = await Enrollment.findOne({ courseId: toCourseId, studentId: student._id });
          if (existing) {
            results.skipped.push(sid);
            continue;
          }

          const enrollment = new Enrollment({ courseId: toCourseId, studentId: student._id });
          await enrollment.save();
          results.transferred.push(sid);
        } catch (e) {
          console.error('Error transferring student', sid, e);
          results.errors.push(sid);
        }
      }

      res.json({ success: true, results });
    } catch (err) {
      console.error('Bulk transfer failed', err);
      res.status(500).json({ error: 'Bulk transfer failed' });
    }
  });

  router.get("/courses/:id", authenticate, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const course = await Course.findById(req.params.id).populate('instructorId', 'fullName');
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Students can only access the course if enrolled
      if (authReq.user.role === 'student') {
        const existing = await Enrollment.findOne({ courseId: course._id, studentId: authReq.user.userId });
        if (!existing) {
          return res.status(403).json({ error: 'You are not enrolled in this course' });
        }
      }

      const response = course.toObject() as any;
      // Only show enrollment key to tutors and admins
      if (authReq.user.role !== 'student') {
        response.enrollmentKey = course.enrollmentKey;
      } else {
        delete response.enrollmentKey;
      }

      // For students, only include chapter metadata and material URLs (no admin-only fields)
      // (chapters are part of the course document already)
      res.json(response);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  // Generate new enrollment key for a course
  router.post("/courses/:id/regenerate-key", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Check if the user is the instructor or admin
      if (authReq.user.role !== 'admin' && course.instructorId.toString() !== authReq.user.userId) {
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
  router.get("/assignments", authenticate, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
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

  router.post("/assignments", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
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
    const authReq = req as AuthenticatedRequest;
    try {
      // Allow updating of common assignment fields: title, instructions, questions, dueDate, attachments, type, isActive, maxScore
      const updatable: any = {};
      const allowed = ['title', 'instructions', 'questions', 'dueDate', 'attachments', 'type', 'isActive', 'maxScore'];
      allowed.forEach((k) => {
        if (req.body[k] !== undefined) updatable[k] = req.body[k];
      });

      const updatedAssignment = await Assignment.findByIdAndUpdate(
        req.params.id,
        updatable,
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

  // Delete an assignment (tutor or admin) - tutor must be instructor for the course
  router.delete('/assignments/:id', authenticate, requireRole(['tutor','admin']), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const assignment = await Assignment.findById(req.params.id).populate('courseId');
      if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

      // If tutor, ensure they are the instructor of the assignment's course
      if (authReq.user.role !== 'admin') {
        const course = assignment.courseId as any;
        if (!course || course.instructorId.toString() !== authReq.user.userId) {
          return res.status(403).json({ error: 'Only the course instructor or admin can delete this assignment' });
        }
      }

      await Assignment.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error('Failed to delete assignment', err);
      res.status(500).json({ error: 'Failed to delete assignment' });
    }
  });

  // Admin: graduate a student (set isGraduated flag)
  router.post('/users/:id/graduate', authenticate, requireRole(['admin']), async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.role !== 'student') return res.status(400).json({ error: 'Only students can be graduated' });
      user.isGraduated = true;
      await user.save();
      res.json({ success: true, user });
    } catch (err) {
      console.error('Error graduating student', err);
      res.status(500).json({ error: 'Failed to graduate student' });
    }
  });

  // Submissions routes
  router.get("/submissions", authenticate, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { assignmentId, studentId, courseId, status, page = '1', limit = '20' } = req.query as any;

      const pg = Math.max(1, parseInt(page, 10) || 1);
      const lim = Math.max(1, Math.min(200, parseInt(limit, 10) || 20));

      const mongoose = require('mongoose');

      // Build aggregation pipeline
      const pipeline: any[] = [];

      // initial match on submission-level fields
      const match: any = {};
      if (assignmentId) match.assignmentId = mongoose.Types.ObjectId(assignmentId);
      if (studentId) match.studentId = mongoose.Types.ObjectId(studentId);
      if (Object.keys(match).length) pipeline.push({ $match: match });

      // lookup assignment
      pipeline.push(
        { $lookup: { from: 'assignments', localField: 'assignmentId', foreignField: '_id', as: 'assignment' } },
        { $unwind: { path: '$assignment', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'courses', localField: 'assignment.courseId', foreignField: '_id', as: 'course' } },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'users', localField: 'studentId', foreignField: '_id', as: 'student' } },
        { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
        // lookup grade for this assignment+student
        { $lookup: {
            from: 'grades',
            let: { aId: '$assignment._id', sId: '$student._id' },
            pipeline: [
              { $match: { $expr: { $and: [ { $eq: ['$assignmentId', '$$aId'] }, { $eq: ['$studentId', '$$sId'] } ] } } },
              { $sort: { gradedAt: -1 } },
            ],
            as: 'grade'
        } },
        { $unwind: { path: '$grade', preserveNullAndEmptyArrays: true } }
      );

      // filter by courseId if provided
      if (courseId) {
        pipeline.push({ $match: { 'assignment.courseId': mongoose.Types.ObjectId(courseId) } });
      }

      // Enforce tutor access: only submissions for courses they instruct
      if (authReq.user.role === 'tutor') {
        pipeline.push({ $match: { 'course.instructorId': mongoose.Types.ObjectId(authReq.user.userId) } });
      }

      // filter by status if requested
      if (status && typeof status === 'string') {
        if (status === 'submitted') pipeline.push({ $match: { 'grade': { $exists: false } } });
        if (status === 'graded') pipeline.push({ $match: { 'grade': { $exists: true } } });
      }

      // Sorting (newest submissions first)
      pipeline.push({ $sort: { submittedAt: -1 } });

      // Facet for pagination + total
      pipeline.push({ $facet: {
        metadata: [ { $count: 'total' } ],
        data: [ { $skip: (pg - 1) * lim }, { $limit: lim } ]
      } });

      const agg = await Submission.aggregate(pipeline).exec();
      const metadata = (agg[0]?.metadata && agg[0].metadata[0]) || { total: 0 };
      const data = agg[0]?.data || [];

      // Map results to a simpler shape
      const items = data.map((d: any) => ({
        _id: d._id,
        assignment: d.assignment || null,
        course: d.course || null,
        student: d.student || null,
        answers: d.answers || {},
        uploadLink: d.uploadLink || null,
        submittedAt: d.submittedAt || d.createdAt,
        grade: d.grade || null,
      }));

      res.json({ items, total: metadata.total || 0, page: pg, limit: lim });
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  router.post("/submissions", authenticate, requireRole(["student"]), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      // Force studentId to the authenticated user to prevent spoofing
      const submissionPayload = { ...req.body, studentId: authReq.user.userId };
      const newSubmission = new Submission(submissionPayload);
      await newSubmission.save();
      
      // Auto-grade if assignment type is "auto"
      const assignment = await Assignment.findById(req.body.assignmentId);
      if (assignment && assignment.type === "auto") {
        // Simple auto-grading logic
        const score = Object.values(req.body.answers || {}).filter((answer: any) => answer.trim()).length;
        const newGrade = new Grade({
          assignmentId: req.body.assignmentId,
          // attribute grade to the authenticated student (or the saved submission studentId)
          studentId: (newSubmission as any).studentId || authReq.user.userId,
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
    const authReq = req as AuthenticatedRequest;
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

  router.post("/grades", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { assignmentId, studentId, score, maxScore, feedback } = req.body;
      if (!assignmentId || !studentId || score === undefined || maxScore === undefined) {
        return res.status(400).json({ error: 'assignmentId, studentId, score and maxScore are required' });
      }

      const grade = new Grade({
        assignmentId,
        studentId,
        score,
        maxScore,
        status: 'graded',
        feedback: feedback || '',
        gradedBy: authReq.user.userId,
        gradedAt: new Date(),
      });
      await grade.save();
      await grade.populate('assignmentId', 'title');
      await grade.populate('studentId', 'fullName');
      await grade.populate('gradedBy', 'fullName');
      res.json(grade);
    } catch (error) {
      console.error('Error creating grade:', error);
      res.status(500).json({ error: 'Failed to create grade' });
    }
  });

  router.put("/grades/:id", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { manualScore, feedback } = req.body;
      const updatedGrade = await Grade.findByIdAndUpdate(
        req.params.id,
        { 
          manualScore, 
          feedback, 
          status: "graded",
          gradedBy: authReq.user.userId,
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
    const authReq = req as AuthenticatedRequest;
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
    const authReq = req as AuthenticatedRequest;
    try {
      // Ensure authorId comes from the authenticated user
      const payload: any = { ...req.body, authorId: authReq.user.userId };
      // If a client passed isGlobal as truthy and courseId empty, normalize
      if (!payload.courseId) payload.isGlobal = true;
      const newAnnouncement = new Announcement(payload);
      await newAnnouncement.save();
      await newAnnouncement.populate('authorId', 'fullName');
      await newAnnouncement.populate('courseId', 'title');
      res.json(newAnnouncement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  // Delete an announcement (tutor or admin) - tutors may delete their own announcements, admins can delete any
  router.delete('/announcements/:id', authenticate, requireRole(['tutor','admin']), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const announcement = await Announcement.findById(req.params.id);
      if (!announcement) return res.status(404).json({ error: 'Announcement not found' });

      if (authReq.user.role !== 'admin' && announcement.authorId.toString() !== authReq.user.userId) {
        return res.status(403).json({ error: 'Only the author or admin may delete this announcement' });
      }

      await Announcement.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error('Failed to delete announcement', err);
      res.status(500).json({ error: 'Failed to delete announcement' });
    }
  });

  // Course enrollments
  router.post("/enrollments", authenticate, requireRole(["student"]), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
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
        studentId: authReq.user.userId
      });

      if (existingEnrollment) {
        return res.status(400).json({ error: "Already enrolled in this course" });
      }

      const enrollment = new Enrollment({
        courseId,
        studentId: authReq.user.userId,
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
    const authReq = req as AuthenticatedRequest;
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

  // Admin: Change admin password
  router.put("/admin/change-password", authenticate, requireRole(["admin"]), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
      }

      // Find the admin user
      const admin = await User.findById(authReq.user.userId);
      if (!admin) {
        return res.status(404).json({ error: "Admin user not found" });
      }

      // Verify current password
      const passwordMatches = await bcrypt.compare(currentPassword, admin.password);
      if (!passwordMatches) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Hash and update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      admin.password = hashedPassword;
      await admin.save();

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing admin password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Admin: Get all users with filters
  router.get("/admin/users", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const { role, department, page = '1', limit = '20' } = req.query;
      
      const pg = Math.max(1, parseInt(page as string, 10) || 1);
      const lim = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));

      const query: any = {};
      if (role) query.role = role;
      if (department) query.department = department;

      const total = await User.countDocuments(query);
      const users = await User.find(query)
        .select('-password')
        .skip((pg - 1) * lim)
        .limit(lim)
        .sort({ createdAt: -1 });

      res.json({ users, total, page: pg, limit: lim });
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Admin: Get user details
  router.get("/admin/users/:id", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Admin: Update user role
  router.put("/admin/users/:id/role", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const { role } = req.body;

      if (!role || !['student', 'tutor', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Admin: Update user details
  router.put("/admin/users/:id", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const { fullName, username, email, role, department, permissions } = req.body;
      const updates: any = {};

      if (fullName !== undefined) updates.fullName = fullName;
      if (username !== undefined) updates.username = username;
      if (email !== undefined) updates.email = email;
      if (department !== undefined) updates.department = department;
      
      if (role !== undefined) {
        if (!['student', 'tutor', 'admin'].includes(role)) {
          return res.status(400).json({ error: "Invalid role" });
        }
        updates.role = role;
      }

      // Update permissions if provided
      if (permissions !== undefined) {
        updates.permissions = {
          canCreateCourses: permissions.canCreateCourses,
          canEditCourses: permissions.canEditCourses,
          canDeleteCourses: permissions.canDeleteCourses,
          canGradeAssignments: permissions.canGradeAssignments,
          canViewAllUsers: permissions.canViewAllUsers,
          canManageEnrollments: permissions.canManageEnrollments,
        };
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error("Error updating user:", error);
      // Handle duplicate key errors
      if ((error as any).code === 11000) {
        const field = Object.keys((error as any).keyPattern)[0];
        return res.status(400).json({ error: `${field} already exists` });
      }
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Admin: Delete user
  router.delete("/admin/users/:id", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Prevent deleting the last admin (optional safety check)
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount === 1) {
        const user = await User.findById(userId);
        if (user?.role === 'admin') {
          return res.status(400).json({ error: "Cannot delete the last admin user" });
        }
      }

      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Clean up associated data
      await Enrollment.deleteMany({ studentId: userId });
      await Course.deleteMany({ instructorId: userId });
      await Submission.deleteMany({ studentId: userId });
      await Grade.deleteMany({ studentId: userId });

      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Admin: Get system statistics
  router.get("/admin/statistics", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const stats = {
        users: {
          total: await User.countDocuments(),
          students: await User.countDocuments({ role: 'student' }),
          tutors: await User.countDocuments({ role: 'tutor' }),
          admins: await User.countDocuments({ role: 'admin' }),
        },
        courses: {
          total: await Course.countDocuments(),
          active: await Course.countDocuments({ isActive: true }),
        },
        assignments: {
          total: await Assignment.countDocuments(),
          active: await Assignment.countDocuments({ isActive: true }),
        },
        submissions: {
          total: await Submission.countDocuments(),
        },
        grades: {
          total: await Grade.countDocuments(),
          graded: await Grade.countDocuments({ status: 'graded' }),
          pending: await Grade.countDocuments({ status: 'pending' }),
        },
        enrollments: {
          total: await Enrollment.countDocuments(),
        },
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Admin: Reset user password
  router.post("/admin/users/:id/reset-password", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent resetting admin password (admins must change their own)
      if (user.role === 'admin') {
        return res.status(400).json({ error: "Admin users must change their own password through settings" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      res.json({ success: true, message: `Password for ${user.fullName} has been reset` });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Enhanced Admin Dashboard Statistics with Trends
  router.get("/admin/dashboard-stats", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      // Get current month and last month dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Current month stats
      const totalUsers = await User.countDocuments();
      const students = await User.countDocuments({ role: 'student' });
      const tutors = await User.countDocuments({ role: 'tutor' });
      const admins = await User.countDocuments({ role: 'admin' });
      const usersThisMonth = await User.countDocuments({ createdAt: { $gte: currentMonthStart } });
      const usersLastMonth = await User.countDocuments({
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
      });

      // Course stats
      const totalCourses = await Course.countDocuments();
      const activeCourses = await Course.countDocuments({ isActive: true });
      const coursesThisMonth = await Course.countDocuments({ createdAt: { $gte: currentMonthStart } });
      const coursesLastMonth = await Course.countDocuments({
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
      });

      // Enrollment stats
      const totalEnrollments = await Enrollment.countDocuments();
      const enrollmentsThisMonth = await Enrollment.countDocuments({ enrolledAt: { $gte: currentMonthStart } });
      const enrollmentsLastMonth = await Enrollment.countDocuments({
        enrolledAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
      });

      // Calculate enrollment rate
      const studentCount = await User.countDocuments({ role: 'student' });
      const enrollmentRate = studentCount > 0 ? Math.round((totalEnrollments / studentCount) * 100) : 0;

      // Get enrollments last month for comparison
      const enrollmentsLastMonthRate = studentCount > 0
        ? Math.round((enrollmentsLastMonth / studentCount) * 100)
        : 0;

      // Submission and Grade stats
      const totalSubmissions = await Submission.countDocuments();
      const totalGrades = await Grade.countDocuments();
      const gradedCount = await Grade.countDocuments({ status: 'graded' });
      const pendingCount = await Grade.countDocuments({ status: 'pending' });

      // Assignment stats
      const totalAssignments = await Assignment.countDocuments();
      const activeAssignments = await Assignment.countDocuments({ isActive: true });

      // Calculate trends (percentage change)
      const userGrowthTrend = usersLastMonth > 0
        ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
        : 0;

      const courseGrowthTrend = coursesLastMonth > 0
        ? Math.round(((coursesThisMonth - coursesLastMonth) / coursesLastMonth) * 100)
        : 0;

      const enrollmentGrowthTrend = enrollmentsLastMonth > 0
        ? Math.round(((enrollmentsThisMonth - enrollmentsLastMonth) / enrollmentsLastMonth) * 100)
        : 0;

      // Get department-wise course distribution
      const departmentStats = await Course.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      // Get recently added users
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('-password');

      // Get top departments by enrollment
      const topDepartments = await Course.aggregate([
        { $lookup: { from: 'enrollments', localField: '_id', foreignField: 'courseId', as: 'enrollments' } },
        { $group: {
          _id: '$department',
          courseCount: { $sum: 1 },
          totalEnrollments: { $sum: { $size: '$enrollments' } }
        }},
        { $sort: { totalEnrollments: -1 } },
        { $limit: 5 }
      ]);

      res.json({
        summary: {
          totalUsers,
          students,
          tutors,
          admins,
          totalCourses,
          activeCourses,
          totalEnrollments,
          enrollmentRate,
          totalAssignments,
          activeAssignments,
          totalSubmissions,
          totalGrades,
          gradedCount,
          pendingCount,
        },
        trends: {
          userGrowth: {
            value: userGrowthTrend,
            isPositive: userGrowthTrend >= 0,
            thisMonth: usersThisMonth,
            lastMonth: usersLastMonth,
          },
          courseGrowth: {
            value: courseGrowthTrend,
            isPositive: courseGrowthTrend >= 0,
            thisMonth: coursesThisMonth,
            lastMonth: coursesLastMonth,
          },
          enrollmentGrowth: {
            value: enrollmentGrowthTrend,
            isPositive: enrollmentGrowthTrend >= 0,
            thisMonth: enrollmentsThisMonth,
            lastMonth: enrollmentsLastMonth,
          },
        },
        departments: {
          byCount: departmentStats,
          byEnrollment: topDepartments,
        },
        recent: {
          users: recentUsers,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });

  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
