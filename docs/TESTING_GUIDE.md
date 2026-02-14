# Quick Start Guide: Testing the Course Module View

## Prerequisites

- Application running (npm run dev or similar)
- At least one course created with chapters/materials
- Student account for testing

## Setup Test Data

### 1. Create a Test Course (as Tutor/Admin)

1. Log in as tutor or admin
2. Navigate to "Create Course"
3. Fill in basic details:
   - Title: "Introduction to Web Design"
   - Department: "Technology"
   - Description: "Learn the fundamentals of modern web design"

4. Add Module 1:
   - Module Title: "Foundations of Design"
   - Add Chapter: "Design Principles"
     - Upload a PDF or add PPT link
   - Add Chapter: "Color Theory"
     - Upload materials

5. Add Module 2:
   - Module Title: "Layout & Grid Systems"
   - Add Chapter: "Introduction to Grids"
     - Add materials

6. Save the course

### 2. View as Student

1. Log out from tutor/admin account
2. Log in as a student
3. Navigate to the course you just created
4. You should see the "Course Modules" tab as default

## Testing Checklist

### ✅ Visual Elements

- [ ] Course header displays correctly with title and progress
- [ ] Course overview card shows description
- [ ] Progress bar is visible (starts at 0%)
- [ ] Instructor info displays with initials avatar
- [ ] Modules are displayed as cards

### ✅ Module Functionality

- [ ] Module 1 shows "In Progress" badge
- [ ] Remaining modules show "Locked" badge
- [ ] Click on Module 1 to expand
- [ ] Lessons appear under expanded module
- [ ] Each lesson shows appropriate icon (based on type)
- [ ] Lesson type badge is visible

### ✅ Completion Tracking

- [ ] Click empty checkbox on first lesson
- [ ] Checkbox turns to green checkmark (✅)
- [ ] Lesson text gets line-through style
- [ ] Button changes from "Start" to "Review"
- [ ] Progress bar updates (increases percentage)
- [ ] Complete all lessons in Module 1
- [ ] Module 1 badge changes to "Completed"
- [ ] Module 2 unlocks (changes from "Locked" to "In Progress")

### ✅ Interaction Features

- [ ] Click "Start" button - opens material (if URL available)
- [ ] Click "Review" button on completed lesson
- [ ] Collapse and expand modules work smoothly
- [ ] Chevron icon rotates on expand/collapse
- [ ] Locked modules don't expand when clicked

### ✅ Responsive Design

- [ ] Works on desktop
- [ ] Works on tablet (if available)
- [ ] Works on mobile view (resize browser)
- [ ] Sticky header stays on scroll

### ✅ Role-Based Views

- [ ] Students see "Course Modules" tab first
- [ ] Tutors/Admins see traditional tabs first
- [ ] All other tabs still accessible (Materials, Chapters, Assignments)

## Common Issues & Solutions

### Issue: Modules don't show up

**Solution**: Make sure the course has chapters with materials added. Check CreateCourse → Modules section.

### Issue: Progress always shows 0%

**Solution**: Complete at least one lesson by clicking the checkbox. Progress calculates based on checked lessons.

### Issue: All modules are locked

**Solution**: By design, Module 1 should start as "In Progress". Check the `getModuleStatus` function logic.

### Issue: Clicking lesson button does nothing

**Solution**: Ensure materials have valid URLs. Check the material object has a `url` field.

### Issue: Module view not appearing for student

**Solution**:

1. Check you're logged in as a student (not tutor/admin)
2. Clear browser cache
3. Check console for errors

## Demo Script

### For Stakeholders/Presentations:

**Step 1: Show Course Creation (Tutor View)**

> "First, tutors create courses with organized modules. Each module contains chapters, and each chapter can have multiple materials - videos, documents, presentations, and quizzes."

**Step 2: Switch to Student View**

> "When students access the course, they see this beautiful, organized module view with clear progress tracking."

**Step 3: Demonstrate Progress Tracking**

> "Students can mark lessons as complete by clicking the checkbox. Watch as the progress bar updates in real-time."

**Step 4: Show Module Unlocking**

> "Once students complete all lessons in a module, the next module automatically unlocks. This keeps students on track and prevents them from jumping ahead."

**Step 5: Highlight Features**

> "Notice the color-coded status badges, lesson type icons, and the responsive design that works on any device."

## Quick Test Command

If you have test data scripts, run:

```bash
# Create test course with modules
node scripts/createTestCourse.js

# Or manually via API/UI as described above
```

## Browser DevTools Testing

Open browser console and check:

```javascript
// Check if modules expanded state is working
console.log(expandedModules);

// Check completed lessons
console.log(completedLessons);

// Calculate progress manually
const totalLessons = course.chapters.reduce(
  (sum, ch) => sum + (ch.materials?.length || 0),
  0,
);
const completed = Object.values(completedLessons).filter(Boolean).length;
console.log(
  `Progress: ${completed}/${totalLessons} = ${((completed / totalLessons) * 100).toFixed(0)}%`,
);
```

## Next Steps After Testing

Once testing is complete and everything works:

1. **Consider Persistence**: Add backend API to save lesson completion
2. **Analytics**: Track which lessons students spend most time on
3. **Notifications**: Alert students when new modules unlock
4. **Certificates**: Generate certificates on course completion
5. **Feedback**: Add lesson rating/feedback feature

## Support

If you encounter any issues:

1. Check browser console for errors
2. Verify course has proper chapter/material structure
3. Ensure you're using supported browser (Chrome, Firefox, Safari)
4. Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for technical details
5. Review [COURSE_MODULES_GUIDE.md](COURSE_MODULES_GUIDE.md) for usage guide

## Feedback Collection

When showing to users, note:

- [ ] What they liked most
- [ ] Any confusing elements
- [ ] Suggested improvements
- [ ] Performance issues
- [ ] Accessibility concerns
