"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_config = require("dotenv/config");
var import_express2 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_mongoose3 = __toESM(require("mongoose"), 1);

// server/routes.ts
var import_http = require("http");
var import_express = require("express");
var import_mongoose2 = __toESM(require("mongoose"), 1);

// server/mongodb.ts
var import_mongoose = __toESM(require("mongoose"), 1);
var userSchema = new import_mongoose.default.Schema({
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
var courseSchema = new import_mongoose.default.Schema({
  title: { type: String, required: true },
  description: { type: String },
  department: { type: String, required: true },
  instructorId: { type: import_mongoose.default.Schema.Types.ObjectId, ref: "User", required: true },
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
var assignmentSchema = new import_mongoose.default.Schema({
  courseId: { type: import_mongoose.default.Schema.Types.ObjectId, ref: "Course", required: true },
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
var submissionSchema = new import_mongoose.default.Schema({
  assignmentId: { type: import_mongoose.default.Schema.Types.ObjectId, ref: "Assignment", required: true },
  studentId: { type: import_mongoose.default.Schema.Types.ObjectId, ref: "User", required: true },
  answers: { type: Map, of: String },
  uploadLink: { type: String },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });
var gradeSchema = new import_mongoose.default.Schema({
  assignmentId: { type: import_mongoose.default.Schema.Types.ObjectId, ref: "Assignment", required: true },
  studentId: { type: import_mongoose.default.Schema.Types.ObjectId, ref: "User", required: true },
  score: { type: Number },
  manualScore: { type: Number },
  maxScore: { type: Number, required: true },
  status: { type: String, enum: ["pending", "graded"], default: "pending" },
  feedback: { type: String },
  gradedBy: { type: import_mongoose.default.Schema.Types.ObjectId, ref: "User" },
  gradedAt: { type: Date }
}, { timestamps: true });
var announcementSchema = new import_mongoose.default.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  authorId: { type: import_mongoose.default.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: import_mongoose.default.Schema.Types.ObjectId, ref: "Course" },
  isGlobal: { type: Boolean, default: false }
}, { timestamps: true });
var enrollmentSchema = new import_mongoose.default.Schema({
  courseId: { type: import_mongoose.default.Schema.Types.ObjectId, ref: "Course", required: true },
  studentId: { type: import_mongoose.default.Schema.Types.ObjectId, ref: "User", required: true },
  enrolledAt: { type: Date, default: Date.now }
}, { timestamps: true });
var User = import_mongoose.default.model("User", userSchema);
var Course = import_mongoose.default.model("Course", courseSchema);
var Assignment = import_mongoose.default.model("Assignment", assignmentSchema);
var Submission = import_mongoose.default.model("Submission", submissionSchema);
var Grade = import_mongoose.default.model("Grade", gradeSchema);
var Announcement = import_mongoose.default.model("Announcement", announcementSchema);
var Enrollment = import_mongoose.default.model("Enrollment", enrollmentSchema);

// server/jwt.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production";
var JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
function generateToken(payload) {
  return import_jsonwebtoken.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
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
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_nanoid = require("nanoid");
var import_fs = __toESM(require("fs"), 1);
var import_meta = {};
async function registerRoutes(app2) {
  const router = (0, import_express.Router)();
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
      if (!import_mongoose2.default.Types.ObjectId.isValid(decoded.userId)) {
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
      database: import_mongoose2.default.connection.readyState === 1 ? "connected" : "disconnected"
    });
  });
  router.post("/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      if (import_mongoose2.default.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not available" });
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      let passwordMatches = false;
      try {
        if (typeof user.password === "string" && user.password.startsWith("$2")) {
          passwordMatches = await import_bcryptjs.default.compare(password, user.password);
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
      const hashed = await import_bcryptjs.default.hash(password, 10);
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
        payload.password = await import_bcryptjs.default.hash(payload.password, 10);
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
      const enrollmentKey = (0, import_nanoid.nanoid)(8).toUpperCase();
      let instructorId = authReq.user.userId;
      if (req.body.instructorId && req.body.instructorId.trim()) {
        const providedId = req.body.instructorId.trim();
        if (!import_mongoose2.default.Types.ObjectId.isValid(providedId)) {
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
                const inviteToken = (0, import_nanoid.nanoid)(12);
                const baseName = (em.split("@")[0] || "invited").replace(/[^a-zA-Z0-9._-]/g, "_");
                let username = `${baseName}_inv`;
                let suffix = 0;
                while (await User.findOne({ username })) {
                  suffix += 1;
                  username = `${baseName}_inv${suffix}`;
                }
                const placeholder = new User({
                  username,
                  password: await import_bcryptjs.default.hash((0, import_nanoid.nanoid)(10), 10),
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
      const uploadsDir = new URL("../attached_assets/uploads", import_meta.url).pathname;
      const filePath = `${uploadsDir}/${Date.now()}_${safeName}`;
      const buffer = Buffer.from(contentBase64, "base64");
      await import_fs.default.promises.writeFile(filePath, buffer);
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
              const inviteToken = (0, import_nanoid.nanoid)(12);
              const baseName = (em.split("@")[0] || "invited").replace(/[^a-zA-Z0-9._-]/g, "_");
              let username = `${baseName}_inv`;
              let suffix = 0;
              while (await User.findOne({ username })) {
                suffix += 1;
                username = `${baseName}_inv${suffix}`;
              }
              const placeholder = new User({
                username,
                password: await import_bcryptjs.default.hash((0, import_nanoid.nanoid)(10), 10),
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
      const newEnrollmentKey = (0, import_nanoid.nanoid)(8).toUpperCase();
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
      const mongoose4 = require("mongoose");
      const pipeline = [];
      const match = {};
      if (assignmentId) match.assignmentId = new mongoose4.Types.ObjectId(assignmentId);
      if (studentId) match.studentId = new mongoose4.Types.ObjectId(studentId);
      if (Object.keys(match).length) pipeline.push({ $match: match });
      pipeline.push(
        { $lookup: { from: "assignments", localField: "assignmentId", foreignField: "_id", as: "assignment" } },
        { $unwind: { path: "$assignment", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "courses", localField: "assignment.courseId", foreignField: "_id", as: "course" } },
        { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "users", localField: "studentId", foreignField: "_id", as: "student" } },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
        // lookup grade for this assignment+student
        { $lookup: {
          from: "grades",
          let: { aId: "$assignment._id", sId: "$student._id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$assignmentId", "$$aId"] }, { $eq: ["$studentId", "$$sId"] }] } } },
            { $sort: { gradedAt: -1 } }
          ],
          as: "grade"
        } },
        { $unwind: { path: "$grade", preserveNullAndEmptyArrays: true } }
      );
      if (courseId) {
        pipeline.push({ $match: { "assignment.courseId": new mongoose4.Types.ObjectId(courseId) } });
      }
      if (authReq.user.role === "tutor") {
        pipeline.push({ $match: { "course.instructorId": new mongoose4.Types.ObjectId(authReq.user.userId) } });
      }
      if (status && typeof status === "string") {
        if (status === "submitted") pipeline.push({ $match: { "grade": { $exists: false } } });
        if (status === "graded") pipeline.push({ $match: { "grade": { $exists: true } } });
      }
      pipeline.push({ $sort: { submittedAt: -1 } });
      pipeline.push({ $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: (pg - 1) * lim }, { $limit: lim }]
      } });
      const agg = await Submission.aggregate(pipeline).exec();
      const metadata = agg[0]?.metadata && agg[0].metadata[0] || { total: 0 };
      const data = agg[0]?.data || [];
      const items = data.map((d) => ({
        _id: d._id,
        assignment: d.assignment || null,
        course: d.course || null,
        student: d.student || null,
        answers: d.answers || {},
        uploadLink: d.uploadLink || null,
        submittedAt: d.submittedAt || d.createdAt,
        grade: d.grade || null
      }));
      res.json({ items, total: metadata.total || 0, page: pg, limit: lim });
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });
  router.post("/submissions", authenticate, requireRole(["student"]), async (req, res) => {
    const authReq = req;
    try {
      const submissionPayload = { ...req.body, studentId: authReq.user.userId };
      const newSubmission = new Submission(submissionPayload);
      await newSubmission.save();
      const assignment = await Assignment.findById(req.body.assignmentId);
      if (assignment && assignment.type === "auto") {
        const score = Object.values(req.body.answers || {}).filter((answer) => answer.trim()).length;
        const newGrade = new Grade({
          assignmentId: req.body.assignmentId,
          // attribute grade to the authenticated student (or the saved submission studentId)
          studentId: newSubmission.studentId || authReq.user.userId,
          score,
          maxScore: assignment.maxScore || 100,
          status: "graded",
          gradedAt: /* @__PURE__ */ new Date()
        });
        await newGrade.save();
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
  const httpServer = (0, import_http.createServer)(app2);
  return httpServer;
}

// api/index.ts
var app = (0, import_express2.default)();
app.use((0, import_cors.default)());
app.use(import_express2.default.json({ limit: "10mb" }));
app.use(import_express2.default.urlencoded({ extended: false, limit: "10mb" }));
var setupDone = null;
function ensureSetup() {
  if (!setupDone) {
    setupDone = (async () => {
      if (process.env.MONGODB_URI && import_mongoose3.default.connection.readyState !== 1) {
        try {
          await import_mongoose3.default.connect(process.env.MONGODB_URI);
        } catch (err) {
          console.error("MongoDB connection failed:", err.message);
        }
      }
      await registerRoutes(app);
    })();
  }
  return setupDone;
}
app.use((err, _req, res, _next) => {
  console.error("API Error:", err);
  res.status(err?.status || 500).json({ error: err?.message || "Internal Server Error" });
});
async function handler(req, res) {
  await ensureSetup();
  return app(req, res);
}
