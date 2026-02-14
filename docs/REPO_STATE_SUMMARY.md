# NYS Virtual Campus - Repository State Summary

**Generated:** 2026-02-14
**Project:** NYS Virtual Campus (National Youth Service Kenya)
**Location:** `/c/Users/ThinkPad/Documents/Afripay/nys/NYSVirtualCampus`

---

## 🎯 Project Overview

**NYS Virtual Campus** is a professional e-learning platform designed for the National Youth Service (NYS) Kenya. It provides a comprehensive learning management system supporting students, tutors/instructors, and administrators.

### **Target Users**
- **Students** - Access courses, submit assignments, track progress
- **Tutors/Instructors** - Create courses, manage content, grade submissions
- **Administrators** - Manage users, oversee system, view analytics

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework:** React 18.3.1 with TypeScript 5.6.3
- **Build Tool:** Vite 6.4.1
- **UI Library:** Radix UI + shadcn/ui components
- **Styling:** Tailwind CSS 3.4.17
- **Forms:** React Hook Form 7.55.0 + Zod validation
- **State:** TanStack React Query 5.60.5
- **Routing:** React Router DOM 7.9.4
- **Charts:** Recharts 2.15.2
- **Icons:** Lucide React 0.453.0
- **Theme:** next-themes 0.4.6 (Dark/Light mode)

### **Backend**
- **Runtime:** Node.js (v18+)
- **Framework:** Express 4.21.2
- **Language:** TypeScript 5.6.3
- **Authentication:** Passport.js 0.7.0 + JWT (jsonwebtoken 9.0.2)
- **Password:** bcrypt 5.1.0
- **Session:** express-session 1.18.1

### **Database**
- **Primary:** MongoDB Atlas (Cloud) via Mongoose 8.19.2
- **Alternative:** PostgreSQL with Drizzle ORM 0.39.1
- **Validation:** Drizzle-zod 0.7.0

### **Deployment**
- **Frontend:** Vercel (static build)
- **Backend:** Render.com / Heroku
- **CI/CD:** GitHub Actions

---

## 📁 Project Structure

```
NYSVirtualCampus/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── pages/              # 22+ page components
│   │   ├── components/         # 71+ UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # API client, auth utilities
│   │   └── __tests__/          # Component tests
│   └── vite.config.ts          # Vite configuration
│
├── server/                      # Backend Express application
│   ├── index.ts                # Server entry point
│   ├── routes.ts               # API endpoints (1267 lines)
│   ├── mongodb.ts              # MongoDB schemas & models
│   ├── jwt.ts                  # JWT utilities
│   └── storage.ts              # File storage
│
├── shared/                      # Shared schemas
│   └── schema.ts               # Database schemas (Drizzle)
│
├── sample-data/                 # Seed data
├── scripts/                     # Testing utilities
├── attached_assets/             # File uploads
└── .github/workflows/           # CI/CD pipeline
```

---

## 🗄️ Database Architecture

### **MongoDB Collections**

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| **users** | User accounts | `username`, `email`, `password`, `role`, `department`, `isGraduated` |
| **courses** | Course content | `title`, `description`, `instructorId`, `chapters[]`, `enrollmentKey`, `isMandatory` |
| **enrollments** | Student-Course links | `courseId`, `studentId`, `enrolledAt` |
| **assignments** | Assignment definitions | `courseId`, `title`, `type` (auto/upload), `questions[]`, `dueDate` |
| **submissions** | Student submissions | `assignmentId`, `studentId`, `answers`, `uploadLink` |
| **grades** | Student grades | `assignmentId`, `studentId`, `score`, `feedback`, `status` |
| **announcements** | System announcements | `title`, `message`, `authorId`, `courseId`, `isGlobal` |

**Database:** `nys_virtual_campus`
**Connection:** MongoDB Atlas (Cloud)
**Status:** ✅ Connected and Operational

---

## 🔌 API Endpoints

### **Base URL:** `/api`

### **Authentication**
- `POST /api/auth/login` - User login (returns JWT)
- `POST /api/auth/register` - Register new user

### **Users** (Admin)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `POST /api/users/:id/graduate` - Graduate student

### **Courses**
- `GET /api/courses` - List courses (enrolled or all)
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (tutor/admin)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/enroll` - Enroll students
- `POST /api/courses/bulk-transfer` - Transfer students

### **Assignments**
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment (tutor/admin)
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment

### **Submissions**
- `GET /api/submissions` - List submissions
- `POST /api/submissions` - Submit assignment (student)

### **Grades**
- `GET /api/grades` - List grades
- `POST /api/grades` - Create grade (tutor/admin)
- `PUT /api/grades/:id` - Update grade/feedback

### **Announcements**
- `GET /api/announcements` - List announcements
- `POST /api/announcements` - Create announcement (tutor/admin)
- `DELETE /api/announcements/:id` - Delete announcement

### **Enrollments**
- `GET /api/enrollments` - List enrollments
- `POST /api/enrollments` - Enroll with key (student)
- `DELETE /api/enrollments/:courseId/:studentId` - Remove enrollment

### **Uploads**
- `POST /api/uploads` - Upload file (base64)

### **Admin**
- `GET /api/admin/dashboard` - Dashboard statistics

### **Health**
- `GET /api/health` - API health check

---

## 🔐 Authentication & Authorization

### **Authentication Flow**
1. User logs in via `/api/auth/login`
2. Server validates credentials and returns JWT token
3. Client stores token in `localStorage`
4. Token sent in `Authorization: Bearer <token>` header
5. Server validates token and extracts user data

### **Role-Based Access Control**

| Role | Permissions |
|------|-------------|
| **student** | View enrolled courses, submit assignments, view grades |
| **tutor** | Create courses, manage assignments, grade submissions |
| **admin** | Full system access, user management, system settings |

### **Security Features**
- ✅ Bcrypt password hashing (10 rounds)
- ✅ JWT token-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Unique enrollment keys per course
- ✅ Filename sanitization on uploads

---

## ✨ Key Features

### **Student Features**
- ✅ Dashboard with course overview & progress
- ✅ Course enrollment via enrollment key
- ✅ Module-based learning interface
- ✅ Assignment submission (auto-grading & upload)
- ✅ Grade & feedback viewing
- ✅ Progress tracking with checkboxes
- ✅ Announcements feed

### **Tutor/Instructor Features**
- ✅ Course creation wizard
- ✅ Chapter & module organization
- ✅ Assignment builder (auto/upload types)
- ✅ Student submission grading
- ✅ Performance analytics
- ✅ Enrollment management
- ✅ Bulk student transfer
- ✅ Course-specific announcements
- ✅ File upload for materials

### **Admin Features**
- ✅ User management (create, view, graduate)
- ✅ Full course administration
- ✅ System analytics dashboard
- ✅ Global announcements
- ✅ Role assignment
- ✅ System settings

### **Special Features**

**Course Module System:**
- Chapter-based organization
- Multiple material types (video, PDF, PPT, quiz, assignment)
- Progressive module unlocking
- Real-time progress tracking

**Assignment System:**
- Auto-grading (multiple choice with images)
- Upload-based submissions
- Manual grading with feedback
- Due date tracking

**Enrollment System:**
- Unique 8-character enrollment keys
- Mandatory vs optional courses
- Email-based bulk enrollment
- Invited student placeholders

---

## 🧪 Testing

### **Testing Framework**
- **Unit:** Vitest 0.34.6
- **Component:** React Testing Library
- **Config:** `vitest.config.ts`

### **Test Files**
- `AddCourseDialog.test.tsx`
- `Header.test.tsx`
- `LoginDialog.test.tsx`
- `useAuth.test.tsx`

### **Integration Tests** (in `/scripts/`)
- `testAdminAPIComplete.cjs`
- `testAdminCourseAPI.cjs`
- `testAdminFunctionality.cjs`

### **Commands**
```bash
npm test              # Run all tests
npm test:watch        # Watch mode
npm run check         # TypeScript type check
```

---

## 🚀 Deployment

### **Vercel (Frontend)**
- Static build deployment
- API proxy to backend server
- SPA fallback routing
- Configuration: `vercel.json`

### **Render.com (Backend)**
- Node.js runtime
- Build: `npm ci && npm run build`
- Start: `npx tsx server/index.ts`
- Configuration: `render.yaml`

### **Environment Variables**
```bash
# Database
MONGODB_URI=mongodb+srv://...
DATABASE_URL=postgresql://...  # Optional

# Authentication
JWT_SECRET=<secret-key>
JWT_EXPIRES_IN=24h

# Server
NODE_ENV=production|development
PORT=5000

# Uploads
UPLOAD_DIR=./attached_assets/uploads
```

---

## 📝 Development Commands

```bash
# Install
npm install

# Development
npm run dev              # Full stack (server + frontend)
npm run dev:frontend     # Frontend only

# Build
npm run build            # Production build

# Database
npm run db:push          # Push schema to DB
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations

# Testing
npm test                 # Run tests
npm test:watch           # Watch mode
npm run check            # Type checking

# Production
npm start                # Run production build
```

---

## 📚 Existing Documentation

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Project overview & setup |
| [DATABASE_CONNECTION.md](DATABASE_CONNECTION.md) | MongoDB setup guide |
| [ADMIN_FUNCTIONALITY_REPORT.md](ADMIN_FUNCTIONALITY_REPORT.md) | Admin features testing |
| [ADMIN_SYSTEM_FINAL_REPORT.md](ADMIN_SYSTEM_FINAL_REPORT.md) | Final admin verification |
| [COURSE_MODULES_GUIDE.md](COURSE_MODULES_GUIDE.md) | Module system usage |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Testing procedures |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Module view implementation |
| [EXAMPLE_DATA.md](EXAMPLE_DATA.md) | Sample data structure |
| [UI_REFERENCE.md](UI_REFERENCE.md) | UI/UX design reference |

---

## 📊 Current Status

### **Database**
- ✅ MongoDB Atlas Connected
- ✅ Sample data loaded (users, courses, assignments)
- ✅ Schemas defined and validated

### **Frontend**
- ✅ 22+ pages implemented
- ✅ 71+ components built
- ✅ Dark/Light theme support
- ✅ Responsive design
- ✅ TypeScript strict mode

### **Backend**
- ✅ All API endpoints functional
- ✅ JWT authentication working
- ✅ Role-based access control
- ✅ File upload system
- ✅ Error handling

### **Testing**
- ✅ Component tests configured
- ✅ Integration test scripts
- ✅ Test utilities setup

### **Deployment**
- ✅ Vercel configuration
- ✅ Render.com configuration
- ✅ Heroku Procfile
- ✅ CI/CD pipeline (GitHub Actions)

---

## 🔧 Key Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript strict mode, path aliases |
| `tailwind.config.ts` | Dark mode, custom colors, fonts |
| `vite.config.ts` | React plugin, dev proxy, chunk splitting |
| `components.json` | shadcn/ui configuration |
| `vercel.json` | Vercel deployment & API proxy |
| `render.yaml` | Render.com backend deployment |
| `drizzle.config.ts` | Drizzle ORM configuration |
| `vitest.config.ts` | Testing configuration |

---

## 🎨 UI/UX Features

- **Design System:** shadcn/ui components
- **Theming:** Dark/Light mode toggle
- **Typography:** Inter, Georgia, JetBrains Mono
- **Colors:** Custom status colors (success, warning, error)
- **Responsiveness:** Mobile-first design
- **Accessibility:** ARIA labels, keyboard navigation
- **Animations:** Tailwind animate, accordion animations

---

## 🔑 Test Credentials

### **Admin Account**
- Email: `admin@nys.com`
- Password: `admin123`

### **Sample Data**
- 15 users (students, tutors, admins)
- 6 courses with chapters
- 12+ enrollments
- 2 assignments
- 1 announcement

---

## ⚠️ Known Limitations

- Progress tracking currently client-side (can be persisted to DB)
- File uploads use base64 encoding (best for small files)
- Email notifications not implemented
- Real-time features use polling (not WebSocket)

---

## 🚀 Future Enhancement Opportunities

1. **Database Progress Persistence** - Save student progress to DB
2. **WebSocket Integration** - Real-time updates
3. **Email Notifications** - Assignment due dates, grades
4. **Enhanced Quiz System** - Auto-grading with detailed feedback
5. **Certificate Generation** - Course completion certificates
6. **Discussion Forums** - Student-Tutor communication
7. **Video Streaming** - Native video hosting
8. **Mobile App** - React Native mobile application
9. **Analytics Dashboard** - Enhanced reporting
10. **Gamification** - Badges, leaderboards, achievements

---

## 📖 Quick Reference

### **Important Files**

| File | Lines | Purpose |
|------|-------|---------|
| `server/routes.ts` | 1267 | Complete API implementation |
| `client/src/App.tsx` | 600+ | Main application component |
| `client/src/pages/CourseDetail.tsx` | 1000+ | Course & module view |
| `client/src/pages/TutorDashboard.tsx` | 2000+ | Tutor interface |
| `client/src/pages/AdminDashboard.tsx` | 700+ | Admin dashboard |
| `server/mongodb.ts` | 148 | Database models |
| `client/src/lib/api.ts` | 276 | API client service |

### **Ports**
- **Frontend Dev:** 5173
- **Backend:** 5000
- **Database:** MongoDB Atlas (cloud)

### **Key Directories**
- `/client/src/pages/` - Page components
- `/client/src/components/` - Reusable components
- `/server/` - Backend code
- `/sample-data/` - Seed data
- `/scripts/` - Test scripts
- `/attached_assets/uploads/` - File uploads

---

## 📞 Support & Resources

- **GitHub Repository:** Check issues for bug reports
- **Documentation:** See existing .md files in root
- **Health Check:** `GET /api/health`
- **Database Status:** Check MongoDB Atlas dashboard

---

**Last Updated:** 2026-02-14
**Version:** 1.0.0
**Status:** Production Ready ✅
