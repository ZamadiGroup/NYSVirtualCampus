# NYS Virtual Campus - Setup Guide

## 🚀 Complete Setup Instructions

### Step 1: Environment Setup

1. **Create `.env` file** in the project root:
```env
MONGODB_URI=mongodb://localhost:27017/nys_virtual_campus
JWT_SECRET=super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
```

### Step 2: MongoDB Setup

1. **Start MongoDB** (if not already running):
   - Windows: Open Command Prompt as Administrator and run `net start MongoDB`
   - Or use MongoDB Compass to connect

2. **Import Sample Data**:
   - Open MongoDB Compass
   - Connect to `mongodb://localhost:27017`
   - Create database: `nys_virtual_campus`
   - Import each JSON file from `sample-data/` folder:
     - `users.json` → `users` collection
     - `courses.json` → `courses` collection
     - `enrollments.json` → `enrollments` collection
     - `assignments.json` → `assignments` collection
     - `submissions.json` → `submissions` collection
     - `grades.json` → `grades` collection
     - `announcements.json` → `announcements` collection

### Step 3: Test Connection

Run the test script to verify everything is working:
```bash
node test-connection.js
```

### Step 4: Start the Application

```bash
npm run dev
```

## 🔍 How to Verify Data is Available in Frontend

### 1. **Check Server Logs**
When you start the server, you should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

### 2. **Test API Endpoints**
Open your browser and test these URLs:
- `http://localhost:5000/api/users` - Should return user data
- `http://localhost:5000/api/courses` - Should return course data
- `http://localhost:5000/api/announcements` - Should return announcements

### 3. **Test Frontend**
1. Open `http://localhost:5173` (Vite dev server)
2. Try logging in with sample credentials:
   - Admin: `john.ochieng@nys.go.ke`
   - Tutor: `sarah.kamau@nys.go.ke`
   - Student: `james.mwangi@nys.go.ke`
   - Password: `password123`

### 4. **Test Course Enrollment**
- Use enrollment keys: `CS1012024` or `BM1012024`

## 🐛 Troubleshooting

### If MongoDB connection fails:
1. **Check if MongoDB is running**:
   ```bash
   # Windows
   net start MongoDB
   
   # Or check services
   services.msc
   ```

2. **Check MongoDB URI**:
   - Default: `mongodb://localhost:27017/nys_virtual_campus`
   - If using different port: `mongodb://localhost:27018/nys_virtual_campus`

3. **Check firewall settings** (if using remote MongoDB)

### If data doesn't appear in frontend:
1. **Check browser console** for errors
2. **Check server logs** for API errors
3. **Verify API endpoints** are working
4. **Check network tab** in browser dev tools

### If authentication fails:
1. **Check JWT_SECRET** in `.env` file
2. **Clear browser localStorage** and try again
3. **Check server logs** for JWT errors

## 📊 Sample Data Overview

After successful import, you should have:
- **5 users** (1 admin, 2 tutors, 2 students)
- **2 courses** with enrollment keys
- **2 enrollments** with progress tracking
- **2 assignments** with due dates
- **2 submissions** from students
- **2 grades** with feedback
- **3 announcements** (system and course-specific)

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | john.ochieng@nys.go.ke | password123 |
| Tutor | sarah.kamau@nys.go.ke | password123 |
| Student | james.mwangi@nys.go.ke | password123 |

## 🎯 Next Steps

1. **Test all user roles** (admin, tutor, student)
2. **Test course enrollment** with enrollment keys
3. **Test assignment submission** workflow
4. **Test admin functions** (add user, add course)
5. **Test announcements** display

## 📞 Support

If you encounter issues:
1. Check the server console for error messages
2. Verify MongoDB is running and accessible
3. Ensure all JSON files imported successfully
4. Check that `.env` file is in the project root
