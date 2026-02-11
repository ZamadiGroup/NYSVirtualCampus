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
  const authenticate: RequestHandler = async (req, res, next) => {
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

      if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
        if (decoded.email) {
          const user = await User.findOne({ email: decoded.email });
          if (!user) {
            return res.status(401).json({ error: "Invalid user" });
          }
          decoded.userId = user._id.toString();
        } else {
          return res.status(401).json({ error: "Invalid user" });
        }
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
      // Validate required fields
      let { username, password, email, fullName, role } = req.body;
      
      if (!password || !email || !fullName) {
        return res.status(400).json({ 
          error: "Missing required fields: password, email, and fullName are required" 
        });
      }

      // Auto-generate username from email if not provided
      if (!username) {
        username = email.split('@')[0];
      }

      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ 
          error: existingUser.email === email ? "Email already in use" : "Username already taken" 
        });
      }

      const payload: any = { ...req.body, username };
      if (payload.password) {
        payload.password = await bcrypt.hash(payload.password, 10);
      }
      
      const newUser = new User(payload);
      await newUser.save();
      res.json(newUser);
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      // Parse mongoose validation errors
      let errorMessage = "Failed to create user";
      if (error.name === 'ValidationError') {
        const fields = Object.keys(error.errors);
        errorMessage = `Validation error: ${fields.join(', ')} are required`;
      } else if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        errorMessage = `${field} already exists`;
      }
      
      res.status(500).json({ error: errorMessage });
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
        return res.json(courses);
      }

      // Tutors and admins see all active courses
      const allCourses = await Course.find({ isActive: true }).populate('instructorId', 'fullName');
      res.json(allCourses);
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
      // Validate required fields
      const { title, department } = req.body;
      if (!title || !department) {
        return res.status(400).json({ 
          error: "Missing required fields: title and department are required" 
        });
      }

      // Generate a unique enrollment key
      const enrollmentKey = nanoid(8).toUpperCase();

      // Default instructorId to the authenticated user if not provided
      // Validate that instructorId is a valid MongoDB ObjectId if provided
      let instructorId = authReq.user.userId;
      if (req.body.instructorId && req.body.instructorId.trim()) {
        const providedId = req.body.instructorId.trim();
        if (!mongoose.Types.ObjectId.isValid(providedId)) {
          return res.status(400).json({ 
            error: "Invalid instructorId: must be a valid MongoDB ObjectId" 
          });
        }
        instructorId = providedId;
      }

      // Persist enrollEmails if provided
      const coursePayload: any = {
        ...req.body,
        instructorId,
        enrollmentKey,
      };

      if (Array.isArray(req.body.enrollEmails)) {
        coursePayload.enrollEmails = req.body.enrollEmails.filter((e: any) => typeof e === 'string' && e.includes('@'));
      }

      // Create the course first
      const newCourse = new Course(coursePayload);
      await newCourse.save();
      await newCourse.populate('instructorId', 'fullName');

      // If course is mandatory, auto-enroll all existing students
      const enrollResults: { processed: string[]; skipped: string[]; notFound: string[] } = { processed: [], skipped: [], notFound: [] };
      if (coursePayload.isMandatory !== false) {
        try {
          const allStudents = await User.find({ role: 'student' });
          for (const student of allStudents) {
            const existing = await Enrollment.findOne({ courseId: newCourse._id, studentId: student._id });
            if (!existing) {
              const enrollment = new Enrollment({ courseId: newCourse._id, studentId: student._id });
              await enrollment.save();
              enrollResults.processed.push(student.email);
            } else {
              enrollResults.skipped.push(student.email);
            }
          }
        } catch (e) {
          console.error('Error auto-enrolling students in mandatory course', e);
        }
      }

      // If enrollEmails provided, try to create enrollments for existing student users
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
                    password: await bcrypt.hash(nanoid(10), 10),
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
    } catch (error: any) {
      console.error("Error creating course:", error);
      // Provide more specific error message for debugging
      const errorMessage = error?.message || "Failed to create course";
      const errorDetails = error?.errors 
        ? Object.values(error.errors).map((e: any) => e.message).join(', ')
        : undefined;
      res.status(500).json({ 
        error: errorDetails || errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      });
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

      // If tutor, ensure they are the instructor
      if (authReq.user.role !== 'admin' && course.instructorId.toString() !== authReq.user.userId) {
        return res.status(403).json({ error: "Only the course instructor or admin can update the course" });
      }

      // Allow updating of specific fields
      const updatable = [
        'title', 'description', 'department', 'notes', 'pptLinks', 'resources', 'attachments', 'tags', 
        'estimatedDuration', 'outline', 'chapters', 'thumbnail', 'isActive', 'isMandatory', 'instructorId', 
        'enrollEmails', 'duration'
      ];

      updatable.forEach((key) => {
        if (req.body[key] !== undefined) {
          (course as any)[key] = req.body[key];
        }
      });

      await course.save();
      await course.populate('instructorId', 'fullName');
      res.json(course);
    } catch (error: any) {
      console.error("Error updating course:", error);
      let errorMessage = "Failed to update course";
      if (error.name === 'ValidationError') {
        const fields = Object.keys(error.errors);
        errorMessage = `Validation error: ${fields.join(', ')}`;
      }
      res.status(500).json({ error: errorMessage });
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

      res.json({ course, enrollments: enrollResults });
    } catch (err) {
      console.error('Error enrolling students', err);
      res.status(500).json({ error: 'Failed to enroll students' });
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
      
      // If user is a student, only return assignments for courses they're enrolled in
      if (authReq.user.role === 'student') {
        const enrollments = await Enrollment.find({ studentId: authReq.user.userId }).select('courseId');
        const enrolledCourseIds = enrollments.map((e) => e.courseId);
        query = { ...query, courseId: { $in: enrolledCourseIds } } as any;
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

  // Admin: graduate a student (set isGraduated flag and remove from all courses)
  router.post('/users/:id/graduate', authenticate, requireRole(['admin']), async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (user.role !== 'student') {
        return res.status(400).json({ error: 'Only students can be graduated' });
      }
      
      // Remove student from all courses by deleting their enrollments
      const deletedEnrollments = await Enrollment.deleteMany({ studentId: req.params.id });
      console.log(`Graduated student ${user.fullName}: removed from ${deletedEnrollments.deletedCount} courses`);
      
      // Mark student as graduated
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { isGraduated: true },
        { new: true }
      );
      
      res.json({ 
        success: true, 
        user: updatedUser,
        removedFromCourses: deletedEnrollments.deletedCount 
      });
    } catch (err: any) {
      console.error('Error graduating student:', err?.message || err);
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
      if (assignmentId) match.assignmentId = new mongoose.Types.ObjectId(assignmentId);
      if (studentId) match.studentId = new mongoose.Types.ObjectId(studentId);
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
        pipeline.push({ $match: { 'assignment.courseId': new mongoose.Types.ObjectId(courseId) } });
      }

      // Enforce tutor access: only submissions for courses they instruct
      if (authReq.user.role === 'tutor') {
        pipeline.push({ $match: { 'course.instructorId': new mongoose.Types.ObjectId(authReq.user.userId) } });
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

  // Get all enrollments (for tutors/admins to see which students are in which courses)
  router.get("/enrollments", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      // If tutor, only return enrollments for courses they instruct
      if (authReq.user.role === 'tutor') {
        const tutorCourses = await Course.find({ instructorId: authReq.user.userId }).select('_id');
        const tutorCourseIds = tutorCourses.map(c => c._id);
        const enrollments = await Enrollment.find({ courseId: { $in: tutorCourseIds } })
          .populate('studentId', 'name email username')
          .populate('courseId', 'title');
        return res.json(enrollments);
      }
      // Admin can see all enrollments
      const enrollments = await Enrollment.find()
        .populate('studentId', 'name email username')
        .populate('courseId', 'title');
      res.json(enrollments);
    } catch (err) {
      console.error('Failed to fetch enrollments', err);
      res.status(500).json({ error: 'Failed to fetch enrollments' });
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

  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
