# NYS Virtual Campus - Design Guidelines

## Design Approach

**Selected Approach:** Hybrid - Reference-Based (KCA University) + Educational Platform Best Practices

**Justification:** Learning Management Systems require functional clarity and consistency. Drawing from KCA University's virtual campus while incorporating modern educational platform standards ensures familiar patterns for Kenyan students while maintaining professional educational integrity.

**Key References:** KCA University Virtual Campus, Canvas LMS, Google Classroom

## Core Design Principles

1. **Clarity over Creativity** - Information hierarchy and findability trump visual flourish
2. **Role-Appropriate Interfaces** - Each user type (Student, Tutor, Admin) sees relevant content only
3. **Green-First Branding** - NYS identity through strategic green application
4. **Accessibility Priority** - Readable at all sizes, keyboard navigable, screen-reader friendly

## Color Palette

### Light Mode
- **Primary Green (NYS Brand):** 142 71% 45% - primary buttons, active states, headers
- **Deep Forest:** 140 60% 25% - navigation bars, footer, important CTAs
- **Sage Accent:** 145 30% 60% - hover states, secondary elements
- **Success Green:** 120 60% 50% - completed assignments, passed grades
- **Warning Amber:** 38 90% 55% - pending submissions, due soon alerts
- **Error Red:** 0 70% 55% - overdue, failed assessments
- **Neutral Gray:** 210 15% 25% - body text
- **Light Background:** 0 0% 98% - page background
- **Card White:** 0 0% 100% - content cards, modals

### Dark Mode
- **Primary Green:** 142 65% 55% - maintain brand recognition
- **Deep Background:** 210 20% 12% - main background
- **Card Dark:** 210 15% 18% - elevated surfaces
- **Border Subtle:** 210 15% 25% - dividers, borders
- **Text Primary:** 0 0% 95% - main content
- **Text Secondary:** 0 0% 70% - supporting text

## Typography

**Font Families:**
- **Headings:** Inter (via Google Fonts) - weights 600, 700
- **Body:** Inter - weights 400, 500
- **Monospace:** JetBrains Mono - for code snippets, file names

**Scale:**
- H1: text-3xl md:text-4xl font-bold - page titles
- H2: text-2xl md:text-3xl font-semibold - section headers
- H3: text-xl font-semibold - card headers, subsections
- Body: text-base - main content
- Small: text-sm - metadata, captions
- Tiny: text-xs - labels, badges

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: py-12 to py-20
- Grid gaps: gap-4 to gap-6
- Content max-width: max-w-7xl for dashboards, max-w-4xl for reading content

**Grid Structure:**
- Dashboard: Sidebar (w-64) + Main Content (flex-1)
- Course Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Assignment List: Single column with clear spacing
- Admin Tables: Full-width with responsive horizontal scroll

## Component Library

### Navigation
- **Top Bar:** Deep forest green background, white text, user profile dropdown (right), NYS logo (left)
- **Sidebar (Desktop):** Vertical navigation, icons + labels, active state with light green background
- **Mobile Menu:** Hamburger → full-screen overlay with large touch targets

### Course Cards
- White/dark cards with subtle shadow
- Course thumbnail (16:9 ratio placeholder or custom image)
- Course title (H3), instructor name (small text), enrollment count
- Progress bar for students (if enrolled)
- Green "Enroll" or "Continue" button

### Dashboard Widgets
- **Stats Cards:** Grid layout, icon + number + label, colored accent borders (left/top)
- **Activity Feed:** Timeline style with timestamps, user avatars, action descriptions
- **Upcoming Deadlines:** List with date badges, priority indicators (color-coded)

### Forms & Inputs
- Rounded inputs (rounded-lg) with clear labels above
- Focus state: green ring (ring-2 ring-green-600)
- Error state: red border with error message below
- File upload: Drag-and-drop zone with dashed border, upload icon, size limits displayed

### Buttons
- **Primary:** Green background, white text, medium padding (px-6 py-3)
- **Secondary:** White/dark background, green border, green text
- **Danger:** Red background for delete actions
- **Ghost:** Transparent with hover background for tertiary actions

### Tables (Admin, Grade Management)
- Striped rows for readability
- Sticky header on scroll
- Action column (right) with icon buttons
- Sortable columns with arrow indicators

### Modals & Overlays
- Centered, max-w-2xl, backdrop blur
- Header with title + close button
- Scrollable content area
- Footer with action buttons (right-aligned)

### Notifications
- Toast notifications (top-right): Success (green), Error (red), Info (blue), Warning (amber)
- Auto-dismiss after 5 seconds with progress bar
- Dismiss button (×) always visible

## Role-Specific Interfaces

### Student Dashboard
- Hero section: "Welcome back, [Name]" with quick stats (enrolled courses, pending assignments)
- Main content: Enrolled courses grid → Assignment deadlines → Recent announcements
- Sidebar: Course navigation, calendar widget

### Tutor Dashboard  
- Course management grid with edit/view actions
- Quick actions: "Create Course," "Post Announcement," "Grade Submissions"
- Analytics cards: Total students, submission rate, average grades
- Course-specific views: Material upload, assignment creation forms

### Admin Panel
- Data tables dominate: User management, course catalog, system settings
- Search and filter controls prominent at top
- Bulk action capabilities with checkboxes
- System health indicators in header

## Images

**Hero Images:** No large hero images - LMS platforms prioritize functional dashboards over marketing visuals

**Course Thumbnails:** 
- Placeholder images in 16:9 ratio (400x225px minimum)
- Green-tinted overlays with white text for course codes
- Category-based default images (Technology, Business, Arts, etc.)

**User Avatars:**
- Circular, 40px diameter in lists, 80px in profiles
- Default: Initials on green gradient background
- Uploaded photos with border

**Instructional Graphics:**
- Inline diagrams/screenshots within course materials
- Assignment instructions may include visual examples
- Keep images constrained to content width (max-w-3xl)

## Animations

**Minimal and Purposeful:**
- Page transitions: Simple fade-in (200ms)
- Dropdown menus: Slide down with fade (150ms)
- Loading states: Spinning icon or skeleton screens (no elaborate animations)
- Success confirmations: Checkmark scale-in (300ms)
- Avoid: Parallax, scroll-triggered animations, decorative motion

## Accessibility

- Minimum contrast ratio 4.5:1 for all text
- Keyboard navigation with visible focus indicators
- ARIA labels for icon-only buttons
- Screen reader announcements for dynamic content updates
- Form validation messages linked to inputs
- Skip-to-content link for keyboard users

## Responsive Behavior

- **Mobile (< 768px):** Vertical navigation, stacked layouts, full-width cards, hamburger menu
- **Tablet (768px - 1024px):** 2-column grids, collapsible sidebar
- **Desktop (> 1024px):** Persistent sidebar, 3-column grids, optimal reading widths

This design system ensures the NYS Virtual Campus is professional, accessible, and aligned with educational platform standards while maintaining strong NYS brand identity through strategic green theming.