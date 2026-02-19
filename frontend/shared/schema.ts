import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["student", "tutor", "admin"]);
export const assignmentTypeEnum = pgEnum("assignment_type", ["auto", "upload"]);
export const gradeStatusEnum = pgEnum("grade_status", ["pending", "graded"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  department: text("department").notNull(),
  instructorId: varchar("instructor_id").notNull().references(() => users.id),
  thumbnail: text("thumbnail"),
  notes: text("notes"),
  pptLinks: jsonb("ppt_links").$type<string[]>().default([]),
  resources: jsonb("resources").$type<Array<{url: string, label: string}>>().default([]),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  estimatedDuration: text("estimated_duration"),
  outline: jsonb("outline").$type<Array<{title: string, description: string}>>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Course enrollments
export const courseEnrollments = pgTable("course_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
});

// Assignments table
export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  type: assignmentTypeEnum("type").notNull(),
  instructions: text("instructions").notNull(),
  dueDate: timestamp("due_date"),
  questions: jsonb("questions").$type<Array<{
    text: string;
    imageUrl?: string;
    choices?: string[];
    correctAnswer?: string;
  }>>().default([]),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  maxScore: integer("max_score").default(100),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Assignment submissions
export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull().references(() => assignments.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  answers: jsonb("answers").$type<Record<string, string>>().default({}),
  uploadLink: text("upload_link"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Grades table
export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull().references(() => assignments.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  score: integer("score"),
  manualScore: integer("manual_score"),
  maxScore: integer("max_score").notNull(),
  status: gradeStatusEnum("status").notNull().default("pending"),
  feedback: text("feedback"),
  gradedBy: varchar("graded_by").references(() => users.id),
  gradedAt: timestamp("graded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  courseId: varchar("course_id").references(() => courses.id), // null for global announcements
  isGlobal: boolean("is_global").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  department: true,
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  description: true,
  department: true,
  instructorId: true,
  thumbnail: true,
  notes: true,
  pptLinks: true,
  resources: true,
  attachments: true,
  tags: true,
  estimatedDuration: true,
  outline: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).pick({
  courseId: true,
  title: true,
  type: true,
  instructions: true,
  dueDate: true,
  questions: true,
  attachments: true,
  maxScore: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  assignmentId: true,
  studentId: true,
  answers: true,
  uploadLink: true,
});

export const insertGradeSchema = createInsertSchema(grades).pick({
  assignmentId: true,
  studentId: true,
  score: true,
  manualScore: true,
  maxScore: true,
  status: true,
  feedback: true,
  gradedBy: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).pick({
  title: true,
  message: true,
  authorId: true,
  courseId: true,
  isGlobal: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof grades.$inferSelect;

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;
