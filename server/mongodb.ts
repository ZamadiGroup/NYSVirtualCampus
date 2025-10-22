import mongoose from 'mongoose';

// MongoDB connection
export const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI must be set in environment variables');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
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
  outline: [{
    title: { type: String },
    description: { type: String }
  }],
  isActive: { type: Boolean, default: true }
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

// Export models
export const User = mongoose.model('User', userSchema);
export const Course = mongoose.model('Course', courseSchema);
export const Assignment = mongoose.model('Assignment', assignmentSchema);
export const Submission = mongoose.model('Submission', submissionSchema);
export const Grade = mongoose.model('Grade', gradeSchema);
export const Announcement = mongoose.model('Announcement', announcementSchema);
export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
