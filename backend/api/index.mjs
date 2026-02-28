// api/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose3 from "mongoose";

// server/routes.ts
import { createServer } from "http";
import { Router } from "express";
import mongoose2 from "mongoose";

// server/mongodb.ts
import mongoose from "mongoose";
var userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ["student", "tutor", "admin"], default: "student" },
  department: { type: String },
  isGraduated: { type: Boolean, default: false },
  // Invitation flow: placeholder accounts created for invited emails
  isInvited: { type: Boolean, default: false },
  inviteToken: { type: String }
}, { timestamps: true });
var courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  department: { type: String, required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  thumbnail: { type: String },
  notes: { type: String },
  pptLinks: [{ type: String }],
  resources: [{
    url: { type: String },
    label: { type: String }
  }],
  attachments: [{ type: String }],
  tags: [{ type: String }],
  estimatedDuration: { type: String },
  duration: { type: Number },
  // Duration in hours (set by tutor)
  isMandatory: { type: Boolean, default: true },
  // All students must join mandatory courses
  // Course template type: Standard, Workshop, Self-Paced, Bootcamp
  template: { type: String, enum: ["Standard", "Workshop", "Self-Paced", "Bootcamp"], default: "Standard" },
  startDate: { type: Date },
  endDate: { type: Date },
  // Chapters: each chapter can have notes and multiple materials (ppt/pdf links)
  chapters: [{
    title: { type: String },
    description: { type: String },
    materials: [{
      type: { type: String },
      // e.g. 'ppt', 'pdf', 'video', 'link'
      url: { type: String },
      label: { type: String }
    }]
  }],
  enrollEmails: [{ type: String }],
  enrollmentKey: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  archived: { type: Boolean, default: false }
}, { timestamps: true });
var assignmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ["auto", "upload"], required: true },
  instructions: { type: String, required: true },
  dueDate: { type: Date },
  questions: [{
    text: { type: String, required: true },
    imageUrl: { type: String },
    choices: [{ type: String }],
    correctAnswer: { type: String }
  }],
  attachments: [{ type: String }],
  maxScore: { type: Number, default: 100 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
var submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: { type: Map, of: String },
  uploadLink: { type: String },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });
var gradeSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  score: { type: Number },
  manualScore: { type: Number },
  maxScore: { type: Number, required: true },
  status: { type: String, enum: ["pending", "graded"], default: "pending" },
  feedback: { type: String },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  gradedAt: { type: Date }
}, { timestamps: true });
var announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  isGlobal: { type: Boolean, default: false }
}, { timestamps: true });
var enrollmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  enrolledAt: { type: Date, default: Date.now }
}, { timestamps: true });
var User = mongoose.models["User"] || mongoose.model("User", userSchema);
var Course = mongoose.models["Course"] || mongoose.model("Course", courseSchema);
var Assignment = mongoose.models["Assignment"] || mongoose.model("Assignment", assignmentSchema);
var Submission = mongoose.models["Submission"] || mongoose.model("Submission", submissionSchema);
var Grade = mongoose.models["Grade"] || mongoose.model("Grade", gradeSchema);
var Announcement = mongoose.models["Announcement"] || mongoose.model("Announcement", announcementSchema);
var Enrollment = mongoose.models["Enrollment"] || mongoose.model("Enrollment", enrollmentSchema);

// server/jwt.ts
import jsonwebtoken from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production";
var JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
function generateToken(payload) {
  return jsonwebtoken.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
  try {
    const decoded = jsonwebtoken.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}
function extractTokenFromHeader(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }
  return parts[1];
}

// server/routes.ts
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import fs from "fs";
async function registerRoutes(app2) {
  const router = Router();
  const authenticate = async (req, res, next) => {
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
      if (!mongoose2.Types.ObjectId.isValid(decoded.userId)) {
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
      req.user = decoded;
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(401).json({ error: "Authentication failed" });
    }
  };
  const requireRole = (roles) => (req, res, next) => {
    const authReq = req;
    if (!roles.includes(authReq.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
  router.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      database: mongoose2.connection.readyState === 1 ? "connected" : "disconnected"
    });
  });
  router.post("/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      if (mongoose2.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not available - Please whitelist IP 41.90.179.245 in MongoDB Atlas" });
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      let passwordMatches = false;
      try {
        if (typeof user.password === "string" && user.password.startsWith("$2")) {
          passwordMatches = await bcrypt.compare(password, user.password);
        } else {
          passwordMatches = user.password === password;
        }
      } catch (e) {
        console.error("Password compare failed", e);
      }
      if (!passwordMatches) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
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
      const requestedRole = req.body.role;
      const role = requestedRole === "tutor" ? "tutor" : "student";
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      const username = req.body.username || (email.includes("@") ? email.split("@")[0] : email);
      const hashed = await bcrypt.hash(password, 10);
      const newUser = new User({
        username,
        email,
        password: hashed,
        fullName,
        role
      });
      await newUser.save();
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
  router.get("/users", authenticate, requireRole(["admin"]), async (req, res) => {
    const authReq = req;
    try {
      const roleFilter = req.query.role || void 0;
      const query = {};
      if (roleFilter) query.role = roleFilter;
      const allUsers = await User.find(query).select("-password");
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  router.get("/users/students", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    try {
      const students = await User.find({ role: "student" }).select("-password");
      res.json(students);
    } catch (err) {
      console.error("Error fetching students for tutors:", err);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });
  router.post("/users", authenticate, requireRole(["admin"]), async (req, res) => {
    const authReq = req;
    try {
      let { username, password, email, fullName, role } = req.body;
      if (!password || !email || !fullName) {
        return res.status(400).json({
          error: "Missing required fields: password, email, and fullName are required"
        });
      }
      if (!username) {
        username = email.split("@")[0];
      }
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({
          error: existingUser.email === email ? "Email already in use" : "Username already taken"
        });
      }
      const payload = { ...req.body, username };
      if (payload.password) {
        payload.password = await bcrypt.hash(payload.password, 10);
      }
      const newUser = new User(payload);
      await newUser.save();
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      let errorMessage = "Failed to create user";
      if (error.name === "ValidationError") {
        const fields = Object.keys(error.errors);
        errorMessage = `Validation error: ${fields.join(", ")} are required`;
      } else if (error.code === 11e3) {
        const field = Object.keys(error.keyPattern)[0];
        errorMessage = `${field} already exists`;
      }
      res.status(500).json({ error: errorMessage });
    }
  });
  router.get("/courses", authenticate, async (req, res) => {
    const authReq = req;
    try {
      if (authReq.user.role === "student") {
        const enrollments = await Enrollment.find({ studentId: authReq.user.userId }).select("courseId");
        const courseIds = enrollments.map((e) => e.courseId);
        const courses = await Course.find({ _id: { $in: courseIds }, isActive: true }).populate("instructorId", "fullName");
        return res.json(courses);
      }
      const allCourses = await Course.find({ isActive: true }).populate("instructorId", "fullName");
      res.json(allCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });
  router.get("/courses/my", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      const courses = await Course.find({ instructorId: authReq.user.userId, isActive: true }).populate("instructorId", "fullName");
      res.json(courses);
    } catch (err) {
      console.error("Error fetching my courses", err);
      res.status(500).json({ error: "Failed to fetch my courses" });
    }
  });
  router.get("/courses/available", authenticate, async (req, res) => {
    const authReq = req;
    try {
      if (authReq.user.role === "student") {
        const enrollments = await Enrollment.find({ studentId: authReq.user.userId }).select("courseId");
        const courseIds = enrollments.map((e) => e.courseId);
        const available = await Course.find({ _id: { $nin: courseIds }, isActive: true }).populate("instructorId", "fullName");
        return res.json(available);
      }
      const all = await Course.find({ isActive: true }).populate("instructorId", "fullName");
      res.json(all);
    } catch (err) {
      console.error("Error fetching available courses", err);
      res.status(500).json({ error: "Failed to fetch available courses" });
    }
  });
  router.post("/courses", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      const { title, department } = req.body;
      if (!title || !department) {
        return res.status(400).json({
          error: "Missing required fields: title and department are required"
        });
      }
      const enrollmentKey = nanoid(8).toUpperCase();
      let instructorId = authReq.user.userId;
      if (req.body.instructorId && req.body.instructorId.trim()) {
        const providedId = req.body.instructorId.trim();
        if (!mongoose2.Types.ObjectId.isValid(providedId)) {
          return res.status(400).json({
            error: "Invalid instructorId: must be a valid MongoDB ObjectId"
          });
        }
        instructorId = providedId;
      }
      const coursePayload = {
        ...req.body,
        instructorId,
        enrollmentKey
      };
      if (Array.isArray(req.body.enrollEmails)) {
        coursePayload.enrollEmails = req.body.enrollEmails.filter((e) => typeof e === "string" && e.includes("@"));
      }
      const newCourse = new Course(coursePayload);
      await newCourse.save();
      await newCourse.populate("instructorId", "fullName");
      const enrollResults = { processed: [], skipped: [], notFound: [] };
      if (coursePayload.isMandatory !== false) {
        try {
          const allStudents = await User.find({ role: "student" });
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
          console.error("Error auto-enrolling students in mandatory course", e);
        }
      }
      if (Array.isArray(coursePayload.enrollEmails) && coursePayload.enrollEmails.length) {
        for (const em of coursePayload.enrollEmails) {
          try {
            const user = await User.findOne({ email: em });
            if (!user) {
              try {
                const inviteToken = nanoid(12);
                const baseName = (em.split("@")[0] || "invited").replace(/[^a-zA-Z0-9._-]/g, "_");
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
                  fullName: "Invited Student",
                  role: "student",
                  isInvited: true,
                  inviteToken
                });
                await placeholder.save();
                const enrollment2 = new Enrollment({ courseId: newCourse._id, studentId: placeholder._id });
                await enrollment2.save();
                enrollResults.processed.push(em);
              } catch (ie) {
                console.error("Failed to create invited placeholder for", em, ie);
                enrollResults.notFound.push(em);
              }
              continue;
            }
            if (user.role !== "student") {
              enrollResults.skipped.push(em);
              continue;
            }
            const existing = await Enrollment.findOne({ courseId: newCourse._id, studentId: user._id });
            if (existing) {
              enrollResults.skipped.push(em);
              continue;
            }
            const enrollment = new Enrollment({ courseId: newCourse._id, studentId: user._id });
            await enrollment.save();
            enrollResults.processed.push(em);
          } catch (e) {
            console.error("Error processing enrollEmail", em, e);
            enrollResults.skipped.push(em);
          }
        }
      }
      res.json({ course: newCourse, enrollments: enrollResults });
    } catch (error) {
      console.error("Error creating course:", error);
      const errorMessage = error?.message || "Failed to create course";
      const errorDetails = error?.errors ? Object.values(error.errors).map((e) => e.message).join(", ") : void 0;
      res.status(500).json({
        error: errorDetails || errorMessage,
        details: process.env.NODE_ENV === "development" ? error?.stack : void 0
      });
    }
  });
  router.post("/uploads", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    try {
      const { filename, contentBase64 } = req.body;
      if (!filename || !contentBase64) return res.status(400).json({ error: "filename and contentBase64 required" });
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uploadsDir = new URL("../attached_assets/uploads", import.meta.url).pathname;
      const filePath = `${uploadsDir}/${Date.now()}_${safeName}`;
      const buffer = Buffer.from(contentBase64, "base64");
      await fs.promises.writeFile(filePath, buffer);
      const urlPath = `/uploads/${filePath.split("/").slice(-1)[0]}`;
      res.json({ url: urlPath });
    } catch (err) {
      console.error("upload error", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });
  router.put("/courses/:id", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      if (authReq.user.role !== "admin" && course.instructorId.toString() !== authReq.user.userId) {
        return res.status(403).json({ error: "Only the course instructor or admin can update the course" });
      }
      const updatable = [
        "title",
        "description",
        "department",
        "notes",
        "pptLinks",
        "resources",
        "attachments",
        "tags",
        "estimatedDuration",
        "outline",
        "chapters",
        "thumbnail",
        "isActive",
        "isMandatory",
        "instructorId",
        "enrollEmails",
        "duration"
      ];
      updatable.forEach((key) => {
        if (req.body[key] !== void 0) {
          course[key] = req.body[key];
        }
      });
      await course.save();
      await course.populate("instructorId", "fullName");
      res.json(course);
    } catch (error) {
      console.error("Error updating course:", error);
      let errorMessage = "Failed to update course";
      if (error.name === "ValidationError") {
        const fields = Object.keys(error.errors);
        errorMessage = `Validation error: ${fields.join(", ")}`;
      }
      res.status(500).json({ error: errorMessage });
    }
  });
  router.delete("/courses/:id", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      if (authReq.user.role !== "admin" && course.instructorId.toString() !== authReq.user.userId) {
        return res.status(403).json({ error: "Only the instructor or admin may delete this course" });
      }
      await Course.findByIdAndDelete(req.params.id);
      await Enrollment.deleteMany({ courseId: req.params.id });
      await Assignment.deleteMany({ courseId: req.params.id });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete course", err);
      res.status(500).json({ error: "Failed to delete course" });
    }
  });
  router.post("/courses/:id/enroll", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      const authReq = req;
      if (authReq.user.role !== "admin" && course.instructorId.toString() !== authReq.user.userId) {
        return res.status(403).json({ error: "Only the instructor or admin may enroll students" });
      }
      const { enrollEmails } = req.body;
      if (!Array.isArray(enrollEmails) || enrollEmails.length === 0) return res.status(400).json({ error: "enrollEmails array required" });
      const enrollResults = { processed: [], skipped: [], notFound: [] };
      course.enrollEmails = Array.from(/* @__PURE__ */ new Set([...course.enrollEmails || [], ...enrollEmails.filter((e) => typeof e === "string")]));
      await course.save();
      for (const em of enrollEmails) {
        try {
          const user = await User.findOne({ email: em });
          if (!user) {
            try {
              const inviteToken = nanoid(12);
              const baseName = (em.split("@")[0] || "invited").replace(/[^a-zA-Z0-9._-]/g, "_");
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
                fullName: "Invited Student",
                role: "student",
                isInvited: true,
                inviteToken
              });
              await placeholder.save();
              const enrollment2 = new Enrollment({ courseId: course._id, studentId: placeholder._id });
              await enrollment2.save();
              enrollResults.processed.push(em);
            } catch (ie) {
              console.error("Failed to create invited placeholder for", em, ie);
              enrollResults.notFound.push(em);
            }
            continue;
          }
          if (user.role !== "student") {
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
          console.error("Error processing enrollEmail", em, e);
          enrollResults.skipped.push(em);
        }
      }
      res.json({ course, enrollments: enrollResults });
    } catch (err) {
      console.error("Error enrolling students", err);
      res.status(500).json({ error: "Failed to enroll students" });
    }
  });
  router.post("/courses/bulk-transfer", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      const { fromCourseId, toCourseId, studentIds } = req.body;
      if (!fromCourseId || !toCourseId || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ error: "fromCourseId, toCourseId and studentIds[] are required" });
      }
      const fromCourse = await Course.findById(fromCourseId);
      const toCourse = await Course.findById(toCourseId);
      if (!fromCourse || !toCourse) return res.status(404).json({ error: "Course not found" });
      if (authReq.user.role !== "admin") {
        const isInstructorOfFrom = fromCourse.instructorId.toString() === authReq.user.userId;
        const isInstructorOfTo = toCourse.instructorId.toString() === authReq.user.userId;
        if (!isInstructorOfFrom && !isInstructorOfTo) {
          return res.status(403).json({ error: "Tutors may only transfer students between courses they instruct" });
        }
      }
      const results = { transferred: [], skipped: [], errors: [] };
      for (const sid of studentIds) {
        try {
          const student = await User.findById(sid);
          if (!student) {
            results.errors.push(sid);
            continue;
          }
          await Enrollment.deleteMany({ courseId: fromCourseId, studentId: student._id });
          const existing = await Enrollment.findOne({ courseId: toCourseId, studentId: student._id });
          if (existing) {
            results.skipped.push(sid);
            continue;
          }
          const enrollment = new Enrollment({ courseId: toCourseId, studentId: student._id });
          await enrollment.save();
          results.transferred.push(sid);
        } catch (e) {
          console.error("Error transferring student", sid, e);
          results.errors.push(sid);
        }
      }
      res.json({ success: true, results });
    } catch (err) {
      console.error("Bulk transfer failed", err);
      res.status(500).json({ error: "Bulk transfer failed" });
    }
  });
  router.get("/courses/:id", authenticate, async (req, res) => {
    const authReq = req;
    try {
      const course = await Course.findById(req.params.id).populate("instructorId", "fullName");
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (authReq.user.role === "student") {
        const existing = await Enrollment.findOne({ courseId: course._id, studentId: authReq.user.userId });
        if (!existing) {
          return res.status(403).json({ error: "You are not enrolled in this course" });
        }
      }
      const response = course.toObject();
      if (authReq.user.role !== "student") {
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
  router.post("/courses/:id/regenerate-key", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (authReq.user.role !== "admin" && course.instructorId.toString() !== authReq.user.userId) {
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
  router.get("/assignments", authenticate, async (req, res) => {
    const authReq = req;
    try {
      const { courseId } = req.query;
      let query = { isActive: true };
      if (courseId) {
        query = { ...query, courseId };
      }
      if (authReq.user.role === "student") {
        const enrollments = await Enrollment.find({ studentId: authReq.user.userId }).select("courseId");
        const enrolledCourseIds = enrollments.map((e) => e.courseId);
        query = { ...query, courseId: { $in: enrolledCourseIds } };
      }
      const allAssignments = await Assignment.find(query).populate("courseId", "title");
      res.json(allAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });
  router.post("/assignments", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      const newAssignment = new Assignment(req.body);
      await newAssignment.save();
      await newAssignment.populate("courseId", "title");
      res.json(newAssignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });
  router.put("/assignments/:id", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      const updatable = {};
      const allowed = ["title", "instructions", "questions", "dueDate", "attachments", "type", "isActive", "maxScore"];
      allowed.forEach((k) => {
        if (req.body[k] !== void 0) updatable[k] = req.body[k];
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
  router.delete("/assignments/:id", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      const assignment = await Assignment.findById(req.params.id).populate("courseId");
      if (!assignment) return res.status(404).json({ error: "Assignment not found" });
      if (authReq.user.role !== "admin") {
        const course = assignment.courseId;
        if (!course || course.instructorId.toString() !== authReq.user.userId) {
          return res.status(403).json({ error: "Only the course instructor or admin can delete this assignment" });
        }
      }
      await Assignment.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete assignment", err);
      res.status(500).json({ error: "Failed to delete assignment" });
    }
  });
  router.post("/users/:id/graduate", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.role !== "student") {
        return res.status(400).json({ error: "Only students can be graduated" });
      }
      const deletedEnrollments = await Enrollment.deleteMany({ studentId: req.params.id });
      console.log(`Graduated student ${user.fullName}: removed from ${deletedEnrollments.deletedCount} courses`);
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
    } catch (err) {
      console.error("Error graduating student:", err?.message || err);
      res.status(500).json({ error: "Failed to graduate student" });
    }
  });
  router.get("/submissions", authenticate, async (req, res) => {
    const authReq = req;
    try {
      const { assignmentId, studentId, courseId, status, page = "1", limit = "20" } = req.query;
      const pg = Math.max(1, parseInt(page, 10) || 1);
      const lim = Math.max(1, Math.min(200, parseInt(limit, 10) || 20));
      const query = {};
      if (assignmentId) {
        if (!mongoose2.Types.ObjectId.isValid(assignmentId)) {
          return res.status(400).json({ error: "Invalid assignmentId format" });
        }
        query.assignmentId = new mongoose2.Types.ObjectId(assignmentId);
      }
      if (studentId) {
        if (!mongoose2.Types.ObjectId.isValid(studentId)) {
          return res.status(400).json({ error: "Invalid studentId format" });
        }
        query.studentId = new mongoose2.Types.ObjectId(studentId);
      }
      const total = await Submission.countDocuments(query);
      const data = await Submission.find(query).populate("assignmentId").populate("studentId", "fullName email").sort({ submittedAt: -1 }).skip((pg - 1) * lim).limit(lim);
      const gradeMap = {};
      if (data.length > 0) {
        const grades = await Grade.find({
          $or: data.map((d) => ({
            assignmentId: d.assignmentId,
            studentId: d.studentId
          }))
        });
        grades.forEach((g) => {
          const key = `${g.assignmentId}_${g.studentId}`;
          gradeMap[key] = g;
        });
      }
      let filteredData = data;
      if (courseId) {
        if (!mongoose2.Types.ObjectId.isValid(courseId)) {
          return res.status(400).json({ error: "Invalid courseId format" });
        }
        filteredData = data.filter(
          (d) => d.assignmentId?.courseId?.toString() === courseId
        );
      }
      if (authReq.user.role === "tutor") {
        filteredData = filteredData.filter((d) => {
          const assignment = d.assignmentId;
          const course = assignment?.courseId;
          return course?.instructorId?.toString() === authReq.user.userId;
        });
      }
      const items = filteredData.map((d) => {
        const gradeKey = `${d.assignmentId?._id}_${d.studentId?._id}`;
        const grade = gradeMap[gradeKey] || null;
        return {
          _id: d._id,
          assignmentId: d.assignmentId?._id || d.assignmentId,
          studentId: d.studentId?._id || d.studentId,
          assignment: d.assignmentId || null,
          student: d.studentId || null,
          answers: d.answers || {},
          uploadLink: d.uploadLink || null,
          submittedAt: d.submittedAt || d.createdAt,
          grade: grade || null
        };
      });
      res.json({ items, total: items.length, page: pg, limit: lim });
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });
  router.post("/submissions", authenticate, requireRole(["student"]), async (req, res) => {
    const authReq = req;
    try {
      const { assignmentId, answers, uploadLink } = req.body || {};
      if (!assignmentId || !mongoose2.Types.ObjectId.isValid(String(assignmentId))) {
        return res.status(400).json({ error: "Valid assignmentId is required" });
      }
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment || assignment.isActive === false) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      const isEnrolled = await Enrollment.exists({
        courseId: assignment.courseId,
        studentId: authReq.user.userId
      });
      if (!isEnrolled) {
        return res.status(403).json({ error: "You are not enrolled in this course" });
      }
      const normalizedAnswers = {};
      if (answers && typeof answers === "object") {
        Object.entries(answers).forEach(([key, value]) => {
          normalizedAnswers[String(key)] = typeof value === "string" ? value : String(value ?? "");
        });
      }
      const submissionPayload = {
        assignmentId,
        studentId: authReq.user.userId,
        answers: normalizedAnswers,
        uploadLink: typeof uploadLink === "string" ? uploadLink : void 0,
        submittedAt: /* @__PURE__ */ new Date()
      };
      const newSubmission = await Submission.findOneAndUpdate(
        { assignmentId, studentId: authReq.user.userId },
        { $set: submissionPayload },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      if (assignment && assignment.type === "auto") {
        let correctCount = 0;
        let totalQuestions = assignment.questions?.length || 0;
        if (totalQuestions > 0 && assignment.questions) {
          assignment.questions.forEach((q, index) => {
            const studentAnswer = normalizedAnswers[String(index)]?.trim().toLowerCase() || "";
            const correctAnswer = q.correctAnswer?.trim().toLowerCase() || "";
            if (studentAnswer === correctAnswer) {
              correctCount++;
            }
          });
        }
        const scorePercentage = totalQuestions > 0 ? correctCount / totalQuestions * 100 : 0;
        const maxScore = assignment.maxScore || 100;
        const score = scorePercentage / 100 * maxScore;
        await Grade.findOneAndUpdate(
          {
            assignmentId,
            studentId: authReq.user.userId
          },
          {
            $set: {
              score: Math.round(score * 100) / 100,
              // Round to 2 decimal places
              maxScore,
              status: "graded",
              gradedAt: /* @__PURE__ */ new Date()
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      res.json(newSubmission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ error: "Failed to create submission" });
    }
  });
  router.get("/grades", authenticate, async (req, res) => {
    const authReq = req;
    try {
      const { studentId, assignmentId } = req.query;
      let query = {};
      if (studentId) {
        query.studentId = studentId;
      }
      if (assignmentId) {
        query.assignmentId = assignmentId;
      }
      const allGrades = await Grade.find(query).populate("assignmentId", "title").populate("studentId", "fullName").populate("gradedBy", "fullName");
      res.json(allGrades);
    } catch (error) {
      console.error("Error fetching grades:", error);
      res.status(500).json({ error: "Failed to fetch grades" });
    }
  });
  router.post("/grades", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      const { assignmentId, studentId, score, maxScore, feedback } = req.body;
      if (!assignmentId || !studentId || score === void 0 || maxScore === void 0) {
        return res.status(400).json({ error: "assignmentId, studentId, score and maxScore are required" });
      }
      const grade = new Grade({
        assignmentId,
        studentId,
        score,
        maxScore,
        status: "graded",
        feedback: feedback || "",
        gradedBy: authReq.user.userId,
        gradedAt: /* @__PURE__ */ new Date()
      });
      await grade.save();
      await grade.populate("assignmentId", "title");
      await grade.populate("studentId", "fullName");
      await grade.populate("gradedBy", "fullName");
      res.json(grade);
    } catch (error) {
      console.error("Error creating grade:", error);
      res.status(500).json({ error: "Failed to create grade" });
    }
  });
  router.put("/grades/:id", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      const { manualScore, feedback } = req.body;
      const updatedGrade = await Grade.findByIdAndUpdate(
        req.params.id,
        {
          manualScore,
          feedback,
          status: "graded",
          gradedBy: authReq.user.userId,
          gradedAt: /* @__PURE__ */ new Date()
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
  router.get("/submissions/:id", authenticate, async (req, res) => {
    const authReq = req;
    try {
      const submission = await Submission.findById(req.params.id).populate({
        path: "assignmentId",
        populate: {
          path: "courseId",
          select: "instructorId title"
        }
      }).populate("studentId", "fullName email");
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      const assignment = submission.assignmentId;
      if (authReq.user.role === "tutor") {
        if (assignment?.courseId?.instructorId?.toString() !== authReq.user.userId) {
          return res.status(403).json({ error: "Unauthorized" });
        }
      }
      const grade = await Grade.findOne({
        assignmentId: submission.assignmentId,
        studentId: submission.studentId
      });
      const detailedQuestions = assignment?.questions?.map((q, idx) => ({
        index: idx,
        text: q.text,
        imageUrl: q.imageUrl,
        choices: q.choices,
        correctAnswer: q.correctAnswer,
        studentAnswer: submission.answers?.get ? submission.answers.get(String(idx)) : submission.answers?.[String(idx)],
        isCorrect: (submission.answers?.get ? submission.answers.get(String(idx)) : submission.answers?.[String(idx)])?.toLowerCase() === q.correctAnswer?.toLowerCase()
      })) || [];
      res.json({
        submission: {
          _id: submission._id,
          assignment,
          student: submission.studentId,
          answers: submission.answers,
          uploadLink: submission.uploadLink,
          submittedAt: submission.submittedAt,
          detailedQuestions
        },
        grade
      });
    } catch (error) {
      console.error("Error fetching submission detail:", error);
      res.status(500).json({ error: "Failed to fetch submission" });
    }
  });
  router.get("/assignments/:assignmentId/my-submission", authenticate, requireRole(["student"]), async (req, res) => {
    const authReq = req;
    try {
      const { assignmentId } = req.params;
      if (!mongoose2.Types.ObjectId.isValid(assignmentId)) {
        return res.status(400).json({ error: "Invalid assignment ID" });
      }
      const submission = await Submission.findOne({
        assignmentId: new mongoose2.Types.ObjectId(assignmentId),
        studentId: authReq.user.userId
      }).populate("assignmentId");
      const grade = await Grade.findOne({
        assignmentId: new mongoose2.Types.ObjectId(assignmentId),
        studentId: authReq.user.userId
      });
      if (!submission) {
        return res.json({
          submitted: false,
          submission: null,
          grade: null
        });
      }
      res.json({
        submitted: true,
        submission: {
          _id: submission._id,
          submittedAt: submission.submittedAt
        },
        grade: grade ? {
          _id: grade._id,
          score: grade.score,
          maxScore: grade.maxScore,
          status: grade.status,
          feedback: grade.feedback,
          gradedAt: grade.gradedAt
        } : null
      });
    } catch (error) {
      console.error("Error fetching my submission:", error);
      res.status(500).json({ error: "Failed to fetch submission status" });
    }
  });
  router.get("/announcements", authenticate, async (req, res) => {
    const authReq = req;
    try {
      const { courseId, isGlobal } = req.query;
      let query = {};
      if (courseId) {
        query.courseId = courseId;
      }
      if (isGlobal === "true") {
        query.isGlobal = true;
      }
      if (authReq.user.role === "student") {
        const enrollments = await Enrollment.find({ studentId: authReq.user.userId }).select("courseId");
        const enrolledCourseIds = enrollments.map((e) => e.courseId);
        if (courseId) {
          const isEnrolled = enrolledCourseIds.some((id) => id.toString() === String(courseId));
          if (!isEnrolled) {
            return res.status(403).json({ error: "You are not enrolled in this course" });
          }
        } else if (isGlobal === "true") {
          query.isGlobal = true;
        } else {
          query = {
            $or: [
              { isGlobal: true },
              { courseId: { $in: enrolledCourseIds } }
            ]
          };
        }
      }
      const allAnnouncements = await Announcement.find(query).populate("authorId", "fullName").populate("courseId", "title").sort({ createdAt: -1 });
      res.json(allAnnouncements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });
  router.post("/announcements", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      const payload = { ...req.body, authorId: authReq.user.userId };
      if (!payload.courseId) payload.isGlobal = true;
      const newAnnouncement = new Announcement(payload);
      await newAnnouncement.save();
      await newAnnouncement.populate("authorId", "fullName");
      await newAnnouncement.populate("courseId", "title");
      res.json(newAnnouncement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });
  router.delete("/announcements/:id", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      const announcement = await Announcement.findById(req.params.id);
      if (!announcement) return res.status(404).json({ error: "Announcement not found" });
      if (authReq.user.role !== "admin" && announcement.authorId.toString() !== authReq.user.userId) {
        return res.status(403).json({ error: "Only the author or admin may delete this announcement" });
      }
      await Announcement.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete announcement", err);
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });
  router.get("/enrollments", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      if (authReq.user.role === "tutor") {
        const tutorCourses = await Course.find({ instructorId: authReq.user.userId }).select("_id");
        const tutorCourseIds = tutorCourses.map((c) => c._id);
        const enrollments2 = await Enrollment.find({ courseId: { $in: tutorCourseIds } }).populate("studentId", "fullName email username").populate("courseId", "title");
        return res.json(enrollments2);
      }
      const enrollments = await Enrollment.find().populate("studentId", "fullName email username").populate("courseId", "title");
      res.json(enrollments);
    } catch (err) {
      console.error("Failed to fetch enrollments", err);
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });
  router.delete("/enrollments/:courseId/:studentId", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    const authReq = req;
    try {
      const { courseId, studentId } = req.params;
      if (authReq.user.role === "tutor") {
        const course = await Course.findById(courseId);
        if (!course) {
          return res.status(404).json({ error: "Course not found" });
        }
        if (course.instructorId.toString() !== authReq.user.userId) {
          return res.status(403).json({ error: "Only the course instructor can remove students" });
        }
      }
      const result = await Enrollment.deleteOne({ courseId, studentId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      res.json({ success: true, message: "Student removed from course" });
    } catch (err) {
      console.error("Failed to delete enrollment", err);
      res.status(500).json({ error: "Failed to remove student from course" });
    }
  });
  router.post("/enrollments", authenticate, requireRole(["student"]), async (req, res) => {
    const authReq = req;
    try {
      const { courseId, enrollmentKey } = req.body;
      if (!courseId || !enrollmentKey) {
        return res.status(400).json({ error: "Course ID and enrollment key are required" });
      }
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.enrollmentKey !== enrollmentKey) {
        return res.status(400).json({ error: "Invalid enrollment key" });
      }
      const existingEnrollment = await Enrollment.findOne({
        courseId,
        studentId: authReq.user.userId
      });
      if (existingEnrollment) {
        return res.status(400).json({ error: "Already enrolled in this course" });
      }
      const enrollment = new Enrollment({
        courseId,
        studentId: authReq.user.userId
      });
      await enrollment.save();
      res.json(enrollment);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      res.status(500).json({ error: "Failed to enroll in course" });
    }
  });
  router.get("/admin/dashboard", authenticate, requireRole(["admin"]), async (req, res) => {
    const authReq = req;
    try {
      const userCount = await User.countDocuments();
      const courseCount = await Course.countDocuments();
      const assignmentCount = await Assignment.countDocuments();
      const submissionCount = await Submission.countDocuments();
      res.json({
        users: userCount,
        courses: courseCount,
        assignments: assignmentCount,
        submissions: submissionCount
      });
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
  app2.use("/api", router);
  const httpServer = createServer(app2);
  return httpServer;
}

// api/index.ts
var app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
var routesRegistered = false;
async function ensureReady() {
  if (process.env.MONGODB_URI && mongoose3.connection.readyState !== 1) {
    try {
      await mongoose3.connect(process.env.MONGODB_URI);
    } catch (err) {
      console.error("MongoDB connection failed:", err.message);
    }
  }
  if (!routesRegistered) {
    await registerRoutes(app);
    routesRegistered = true;
  }
}
app.use((err, _req, res, _next) => {
  console.error("API Error:", err);
  res.status(err?.status || 500).json({ error: err?.message || "Internal Server Error" });
});
async function handler(req, res) {
  await ensureReady();
  return app(req, res);
}
export {
  handler as default
};
