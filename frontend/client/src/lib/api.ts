// API service functions for communicating with the backend

const API_BASE = '/api';

// Generic API call function
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Attach Authorization header automatically when a token exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'API call failed');
  }

  return response.json();
}

// Users API
export const usersApi = {
  getAll: () => apiCall('/users'),
  getByRole: (role: string) => apiCall(`/users?role=${encodeURIComponent(role)}`),
  // Tutors and admins can fetch students via this dedicated endpoint
  getStudents: () => apiCall('/users/students'),
  create: (userData: any) => apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  graduate: (id: string) => apiCall(`/users/${id}/graduate`, { method: 'POST' }),
  bulkCreate: (users: any[]) => apiCall('/users/bulk', {
    method: 'POST',
    body: JSON.stringify({ users }),
  }),
};

// Courses API
export const coursesApi = {
  getAll: () => apiCall('/courses'),
  getMine: () => apiCall('/courses/my'),
  getAvailable: () => apiCall('/courses/available'),
  getById: (id: string) => apiCall(`/courses/${id}`),
  create: (courseData: any) => apiCall('/courses', {
    method: 'POST',
    body: JSON.stringify(courseData),
  }),
  update: (id: string, courseData: any) => apiCall(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(courseData),
  }),
  delete: (id: string) => apiCall(`/courses/${id}`, { method: 'DELETE' }),
  enroll: (id: string, enrollEmails: string[]) => apiCall(`/courses/${id}/enroll`, {
    method: 'POST',
    body: JSON.stringify({ enrollEmails }),
  }),
  getMyEnrollments: () => apiCall('/courses'),
  bulkTransfer: (payload: { fromCourseId: string; toCourseId: string; studentIds: string[] }) => apiCall('/courses/bulk-transfer', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

// Assignments API
export const assignmentsApi = {
  getAll: (courseId?: string) => {
    const params = courseId ? `?courseId=${courseId}` : '';
    return apiCall(`/assignments${params}`);
  },
  create: (assignmentData: any) => apiCall('/assignments', {
    method: 'POST',
    body: JSON.stringify(assignmentData),
  }),
  update: (id: string, assignmentData: any) => apiCall(`/assignments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(assignmentData),
  }),
  delete: (id: string) => apiCall(`/assignments/${id}`, { method: 'DELETE' }),
  updateDueDate: (id: string, dueDate: string) => apiCall(`/assignments/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ dueDate }),
  }),
};

// Uploads API (server accepts base64 payload and returns a /uploads URL)
export const uploadsApi = {
  upload: (file: File) => {
    return new Promise<{ url: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          // dataUrl is like 'data:<mime>;base64,<base64data>'
          const base64 = dataUrl.split(',')[1];
          const res = await apiCall('/uploads', {
            method: 'POST',
            body: JSON.stringify({ filename: file.name, contentBase64: base64 }),
          });
          resolve(res as { url: string });
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsDataURL(file);
    });
  },
};

// Submissions API
export const submissionsApi = {
  getAll: (opts?: { assignmentId?: string; studentId?: string; courseId?: string; status?: 'all' | 'submitted' | 'graded'; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (opts?.assignmentId) params.append('assignmentId', opts.assignmentId);
    if (opts?.studentId) params.append('studentId', opts.studentId);
    if (opts?.courseId) params.append('courseId', opts.courseId);
    if (opts?.status && opts.status !== 'all') params.append('status', opts.status);
    if (opts?.page) params.append('page', String(opts.page));
    if (opts?.limit) params.append('limit', String(opts.limit));
    const queryString = params.toString();
    return apiCall(`/submissions${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => apiCall(`/submissions/${id}`),
  getMySubmissionStatus: (assignmentId: string) => apiCall(`/assignments/${assignmentId}/my-submission`),
  create: (submissionData: any) => apiCall('/submissions', {
    method: 'POST',
    body: JSON.stringify(submissionData),
  }),
};

// Grades API
export const gradesApi = {
  getAll: (studentId?: string, assignmentId?: string) => {
    const params = new URLSearchParams();
    if (studentId) params.append('studentId', studentId);
    if (assignmentId) params.append('assignmentId', assignmentId);
    const queryString = params.toString();
    return apiCall(`/grades${queryString ? `?${queryString}` : ''}`);
  },
  update: (id: string, gradeData: { manualScore?: number; score?: number; feedback?: string }) => apiCall(`/grades/${id}`, {
    method: 'PUT',
    body: JSON.stringify(gradeData),
  }),
  create: (gradeData: any) => apiCall('/grades', { method: 'POST', body: JSON.stringify(gradeData) }),
};

// Announcements API
export const announcementsApi = {
  getAll: (courseId?: string, isGlobal?: boolean) => {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (isGlobal !== undefined) params.append('isGlobal', isGlobal.toString());
    const queryString = params.toString();
    return apiCall(`/announcements${queryString ? `?${queryString}` : ''}`);
  },
  create: (announcementData: any) => apiCall('/announcements', {
    method: 'POST',
    body: JSON.stringify(announcementData),
  }),
  delete: (id: string) => apiCall(`/announcements/${id}`, { method: 'DELETE' }),
};

// Enrollments API
export const enrollmentsApi = {
  getAll: () => apiCall('/enrollments'),
  create: (courseId: string) => apiCall('/enrollments', {
    method: 'POST',
    body: JSON.stringify({ courseId }),
  }),
  delete: (courseId: string, studentId: string) => apiCall(`/enrollments/${courseId}/${studentId}`, {
    method: 'DELETE',
  }),
};

// Admin API
export const adminApi = {
  getDashboardData: () => apiCall('/admin/dashboard'),
};

// Types for API responses
export type ApiUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'student' | 'tutor' | 'admin';
  department?: string;
  isGraduated?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiCourse = {
  id: string;
  title: string;
  description?: string;
  department: string;
  instructorId: string;
  thumbnail?: string;
  notes?: string;
  pptLinks: string[];
  resources: Array<{url: string, label: string}>;
  attachments: string[];
  tags: string[];
  estimatedDuration?: string;
  duration?: number;
  isMandatory?: boolean;
  enrollmentKey?: string;
  startDate?: string;
  endDate?: string;
  archived?: boolean;
    chapters?: Array<{ title?: string; description?: string; materials?: Array<{ type?: string; url?: string; label?: string }> }>;
    enrollEmails?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiAssignment = {
  id: string;
  courseId: string;
  title: string;
  type: 'auto' | 'upload';
  instructions: string;
  dueDate?: string;
  questions: Array<{
    text: string;
    imageUrl?: string;
    choices?: string[];
    correctAnswer?: string;
  }>;
  attachments: string[];
  maxScore: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiSubmission = {
  id: string;
  assignmentId: string;
  studentId: string;
  answers: Record<string, string>;
  uploadLink?: string;
  submittedAt: string;
};

export type ApiGrade = {
  id: string;
  assignmentId: string;
  studentId: string;
  score?: number;
  manualScore?: number;
  maxScore: number;
  status: 'pending' | 'graded';
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiAnnouncement = {
  id: string;
  title: string;
  message: string;
  authorId: string;
  courseId?: string;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
};
