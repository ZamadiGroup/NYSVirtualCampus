import mongoose from 'mongoose';

// MongoDB connection
export const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      // Prefer MongoDB when MONGODB_URI is provided
      try {
        // Use native DNS resolution to bypass Node.js DNS issues on Windows
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          family: 4, // Force IPv4
        });
        console.log('✅ Connected to MongoDB Atlas');
        console.log('📍 Database:', mongoose.connection.db?.databaseName);
        return;
      } catch (mongoError) {
        console.error('❌ MongoDB connection failed:', (mongoError as Error).message);
        console.error('Connection string (masked):', process.env.MONGODB_URI?.replace(/:[^:@]*@/, ':****@'));
        // Don't re-throw - allow app to continue with other databases
      }
    }

    // If no Mongo URI, but a Postgres DATABASE_URL is present, the server may be configured
    // to use the Postgres / Drizzle layer instead. Log this and continue.
    if (process.env.DATABASE_URL) {
      console.warn('⚠️ Using DATABASE_URL for Postgres/Drizzle layer.');
      return;
    }

    console.warn('⚠️ No MONGODB_URI or DATABASE_URL configured. Server starting without database.');
  } catch (error) {
    console.error('❌ Database setup error:', error);
    // Don't re-throw - allow server to start anyway
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
  department: { type: String },
  isGraduated: { type: Boolean, default: false },
  // Invitation flow: placeholder accounts created for invited emails
  isInvited: { type: Boolean, default: false },
  inviteToken: { type: String },
}, { timestamps: true });

// Course Schema
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  department: { type: String, required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
  duration: { type: Number }, // Duration in hours (set by tutor)
  isMandatory: { type: Boolean, default: true }, // All students must join mandatory courses
  // Course template type: Standard, Workshop, Self-Paced, Bootcamp
  template: { type: String, enum: ['Standard', 'Workshop', 'Self-Paced', 'Bootcamp'], default: 'Standard' },
  startDate: { type: Date },
  endDate: { type: Date },
  // Chapters: each chapter can have notes and multiple materials (ppt/pdf links)
  chapters: [{
    title: { type: String },
    description: { type: String },
    materials: [{
      type: { type: String }, // e.g. 'ppt', 'pdf', 'video', 'link'
      url: { type: String },
      label: { type: String }
    }]
  }],
  enrollEmails: [{ type: String }],
  enrollmentKey: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  archived: { type: Boolean, default: false }
}, { timestamps: true });

// Assignment Schema
const assignmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['auto', 'upload'], required: true },
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

// Submission Schema
const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: { type: Map, of: String },
  uploadLink: { type: String },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Grade Schema
const gradeSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number },
  manualScore: { type: Number },
  maxScore: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'graded'], default: 'pending' },
  feedback: { type: String },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: { type: Date }
}, { timestamps: true });

// Announcement Schema
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  isGlobal: { type: Boolean, default: false }
}, { timestamps: true });

// Course Enrollment Schema
const enrollmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Export models — use cache guard to prevent "Cannot overwrite model" on warm Lambda invocations
export const User = (mongoose.models['User'] as mongoose.Model<any>) || mongoose.model('User', userSchema);
export const Course = (mongoose.models['Course'] as mongoose.Model<any>) || mongoose.model('Course', courseSchema);
export const Assignment = (mongoose.models['Assignment'] as mongoose.Model<any>) || mongoose.model('Assignment', assignmentSchema);
export const Submission = (mongoose.models['Submission'] as mongoose.Model<any>) || mongoose.model('Submission', submissionSchema);
export const Grade = (mongoose.models['Grade'] as mongoose.Model<any>) || mongoose.model('Grade', gradeSchema);
export const Announcement = (mongoose.models['Announcement'] as mongoose.Model<any>) || mongoose.model('Announcement', announcementSchema);
export const Enrollment = (mongoose.models['Enrollment'] as mongoose.Model<any>) || mongoose.model('Enrollment', enrollmentSchema);
