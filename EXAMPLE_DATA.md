# Example Course Data Structure

This document shows the exact data structure needed for the module view to work correctly.

## Sample Course Object

```json
{
  "id": "course-123",
  "title": "Introduction to Web Design",
  "description": "Learn the fundamentals of modern web design, from typography to responsive layouts",
  "department": "Technology",
  "instructorId": {
    "id": "instructor-1",
    "fullName": "Sarah Chen",
    "email": "sarah.chen@example.com"
  },
  "chapters": [
    {
      "title": "Foundations of Design",
      "description": "Essential design principles and visual hierarchy",
      "materials": [
        {
          "type": "video",
          "url": "https://example.com/videos/design-principles.mp4",
          "label": "Design Principles Explained"
        },
        {
          "type": "video",
          "url": "https://example.com/videos/color-theory.mp4",
          "label": "Color Theory Basics"
        },
        {
          "type": "ppt",
          "url": "https://example.com/slides/typography.pptx",
          "label": "Typography Guide"
        },
        {
          "type": "quiz",
          "url": "https://example.com/quiz/fundamentals",
          "label": "Quiz: Design Fundamentals"
        }
      ]
    },
    {
      "title": "Layout & Grid Systems",
      "description": "Master grid systems and responsive design patterns",
      "materials": [
        {
          "type": "video",
          "url": "https://example.com/videos/intro-grids.mp4",
          "label": "Introduction to Grids"
        },
        {
          "type": "video",
          "url": "https://example.com/videos/css-grid.mp4",
          "label": "CSS Grid Deep Dive"
        },
        {
          "type": "file",
          "url": "https://example.com/docs/responsive-breakpoints.pdf",
          "label": "Responsive Breakpoints"
        },
        {
          "type": "assignment",
          "url": "https://example.com/assignments/grid-layout",
          "label": "Practice: Build a Grid Layout"
        }
      ]
    },
    {
      "title": "Interactive Components",
      "description": "Create engaging buttons, forms, and interactive elements",
      "materials": [
        {
          "type": "video",
          "url": "https://example.com/videos/button-design.mp4",
          "label": "Button Design Patterns"
        },
        {
          "type": "video",
          "url": "https://example.com/videos/form-design.mp4",
          "label": "Form Design Best Practices"
        },
        {
          "type": "file",
          "url": "https://example.com/docs/micro-interactions.pdf",
          "label": "Micro-interactions & Feedback"
        }
      ]
    }
  ],
  "tags": ["design", "web", "beginner"],
  "estimatedDuration": "8 weeks",
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

## Material Types Reference

### Video

```json
{
  "type": "video",
  "url": "https://example.com/video.mp4",
  "label": "Introduction to Programming"
}
```

- Icon: ▶️ (Play icon, purple)
- Badge: "Video"

### PPT/Presentation

```json
{
  "type": "ppt",
  "url": "https://example.com/slides.pptx",
  "label": "Course Overview Slides"
}
```

- Icon: 📄 (FileText icon, blue)
- Badge: "Presentation"

### Document/File

```json
{
  "type": "file",
  "url": "https://example.com/document.pdf",
  "label": "Reading Material"
}
```

- Icon: 📄 (FileText icon, blue)
- Badge: "Document"

### Quiz

```json
{
  "type": "quiz",
  "url": "https://example.com/quiz/1",
  "label": "Module Assessment"
}
```

- Icon: 📖 (BookOpen icon, orange)
- Badge: "Quiz"

### Assignment

```json
{
  "type": "assignment",
  "url": "https://example.com/assignment/1",
  "label": "Final Project"
}
```

- Icon: 📊 (BarChart3 icon, green)
- Badge: "Assignment"

## Creating Test Data via API

### POST /api/courses

```json
{
  "title": "Web Development Bootcamp",
  "description": "Complete web development course",
  "department": "Technology",
  "chapters": [
    {
      "title": "HTML Basics",
      "description": "Learn HTML fundamentals",
      "materials": [
        {
          "type": "video",
          "url": "https://youtube.com/watch?v=example1",
          "label": "HTML Introduction"
        },
        {
          "type": "file",
          "url": "https://drive.google.com/file/d/example",
          "label": "HTML Cheat Sheet"
        }
      ]
    },
    {
      "title": "CSS Fundamentals",
      "description": "Style your web pages",
      "materials": [
        {
          "type": "video",
          "url": "https://youtube.com/watch?v=example2",
          "label": "CSS Basics"
        },
        {
          "type": "ppt",
          "url": "https://slides.google.com/presentation/d/example",
          "label": "CSS Selectors Guide"
        },
        {
          "type": "quiz",
          "url": "/quiz/css-basics",
          "label": "CSS Quiz"
        }
      ]
    }
  ],
  "tags": ["web", "html", "css"],
  "estimatedDuration": "4 weeks"
}
```

## Mapping from CreateCourse to Student View

### CreateCourse Structure (Tutor Input)

```
Module {
  title: "Web Fundamentals"
  chapters: [
    {
      title: "HTML Basics"
      notes: "Introduction to HTML"
      files: ["file1.pdf", "file2.pdf"]
      pptLinks: ["http://slides.com/1"]
    }
  ]
}
```

### Transformed to Backend Schema

```json
{
  "chapters": [
    {
      "title": "Web Fundamentals - HTML Basics",
      "description": "Introduction to HTML",
      "materials": [
        {
          "type": "file",
          "url": "file1.pdf",
          "label": ""
        },
        {
          "type": "file",
          "url": "file2.pdf",
          "label": ""
        },
        {
          "type": "ppt",
          "url": "http://slides.com/1",
          "label": ""
        }
      ]
    }
  ]
}
```

### Displayed in Student View

```
Module 1: Web Fundamentals - HTML Basics
  Description: Introduction to HTML

  Lessons:
  □ 📄 file1.pdf [Document] [Start]
  □ 📄 file2.pdf [Document] [Start]
  □ 📄 Presentation [Presentation] [Start]
```

## Quick SQL Insert (If using SQL database)

```sql
-- Insert a test course
INSERT INTO courses (
  id,
  title,
  description,
  department,
  instructor_id,
  chapters
) VALUES (
  gen_random_uuid(),
  'Introduction to Programming',
  'Learn programming from scratch',
  'Computer Science',
  'instructor-uuid-here',
  '[
    {
      "title": "Getting Started",
      "description": "Introduction to programming concepts",
      "materials": [
        {
          "type": "video",
          "url": "https://example.com/intro.mp4",
          "label": "Welcome Video"
        },
        {
          "type": "file",
          "url": "https://example.com/syllabus.pdf",
          "label": "Course Syllabus"
        }
      ]
    },
    {
      "title": "Variables and Data Types",
      "description": "Understanding variables",
      "materials": [
        {
          "type": "video",
          "url": "https://example.com/variables.mp4",
          "label": "Variables Explained"
        },
        {
          "type": "quiz",
          "url": "/quiz/variables",
          "label": "Variables Quiz"
        }
      ]
    }
  ]'::jsonb
);
```

## MongoDB Insert (If using MongoDB)

```javascript
db.courses.insertOne({
  title: "Data Science Fundamentals",
  description: "Introduction to data science",
  department: "Technology",
  instructorId: ObjectId("instructor_id_here"),
  chapters: [
    {
      title: "Introduction to Data Science",
      description: "What is data science?",
      materials: [
        {
          type: "video",
          url: "https://example.com/intro-ds.mp4",
          label: "Data Science Overview",
        },
        {
          type: "file",
          url: "https://example.com/ds-basics.pdf",
          label: "DS Basics Reading",
        },
        {
          type: "quiz",
          url: "/quiz/ds-intro",
          label: "Introduction Quiz",
        },
      ],
    },
    {
      title: "Python for Data Science",
      description: "Learn Python basics",
      materials: [
        {
          type: "video",
          url: "https://example.com/python-intro.mp4",
          label: "Python Basics",
        },
        {
          type: "ppt",
          url: "https://example.com/python-slides.pptx",
          label: "Python Slides",
        },
        {
          type: "assignment",
          url: "/assignment/python-basics",
          label: "Python Exercise",
        },
      ],
    },
  ],
  tags: ["data-science", "python", "analytics"],
  estimatedDuration: "6 weeks",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

## Validation Rules

### Required Fields

- `chapters[].title` ✅ (string)
- `chapters[].materials` ✅ (array)
- `chapters[].materials[].type` ✅ (string: video|ppt|file|quiz|assignment)
- `chapters[].materials[].url` ✅ (string: valid URL)

### Optional Fields

- `chapters[].description` (string)
- `chapters[].materials[].label` (string)

### Default Behavior

- If no `label`: Uses filename from URL or "Lesson N"
- If no `description`: Shows "No description"
- If no `materials`: Shows "No lessons available"

## Testing Different Scenarios

### Empty Course

```json
{
  "title": "Empty Course",
  "chapters": []
}
```

**Expected**: "No modules available yet."

### Single Module

```json
{
  "title": "Quick Course",
  "chapters": [
    {
      "title": "Only Module",
      "materials": [
        { "type": "video", "url": "test.mp4", "label": "Test Video" }
      ]
    }
  ]
}
```

**Expected**: One module showing "In Progress"

### Multiple Modules

```json
{
  "chapters": [
    {"title": "Module 1", "materials": [...]},
    {"title": "Module 2", "materials": [...]},
    {"title": "Module 3", "materials": [...]}
  ]
}
```

**Expected**: Module 1 "In Progress", others "Locked"

## Notes

- All URLs should be valid and accessible
- Material types should match one of the supported types
- Empty materials arrays are handled gracefully
- Missing labels fall back to URL filename
