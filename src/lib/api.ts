const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // If we're sending URL encoded data, don't override the content type with json
  if (options.body instanceof URLSearchParams) {
    delete headers['Content-Type'];
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignored — body may not be JSON
    }
    // FastAPI can return detail as a string OR as an array of validation error objects
    const detail = errorData?.detail;
    let message: string;
    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      // Validation error: pick the first human-readable message
      message = detail.map((d: any) => d?.msg ?? JSON.stringify(d)).join('; ');
    } else {
      message = `Request failed with status ${response.status}`;
    }
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  // Auth
  signup: (data: any) => fetchAPI('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  // Backend login expects JSON: { email, password } — NOT OAuth2 form data
  login: (data: { email: string; password: string }) =>
    fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => fetchAPI('/auth/me', { method: 'GET' }),
  updateProfile: (data: Record<string, any>) =>
    fetchAPI('/students/me', { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAccount: () => fetchAPI('/students/me', { method: 'DELETE' }),

  // Companies
  getCompanyProfile: () => fetchAPI('/companies/me', { method: 'GET' }),
  updateCompanyProfile: (data: Record<string, any>) =>
    fetchAPI('/companies/me', { method: 'PATCH', body: JSON.stringify(data) }),

  // Drives
  createDrive: (data: any) => fetchAPI('/drives', { method: 'POST', body: JSON.stringify(data) }),
  getDrives: () => fetchAPI('/drives', { method: 'GET' }),
  getDrive: (id: string) => fetchAPI(`/drives/${id}`, { method: 'GET' }),
  updateDrive: (id: string, data: any) => fetchAPI(`/drives/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getMyCompanyDrives: () => fetchAPI('/drives/company/mine', { method: 'GET' }),
  getCompanyAnalytics: () => fetchAPI('/drives/company/analytics', { method: 'GET' }),

  // Applications
  applyToDrive: (driveId: string) => fetchAPI('/applications', { method: 'POST', body: JSON.stringify({ drive_id: driveId }) }),
  getMyApplications: () => fetchAPI('/applications/mine', { method: 'GET' }),
  getDriveApplications: (driveId: string) => fetchAPI(`/applications/drive/${driveId}`, { method: 'GET' }),
  updateApplicationStage: (id: string, stage: string) => fetchAPI(`/applications/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ current_stage: stage }) }),
  getApplication: (id: string) => fetchAPI(`/applications/${id}`, { method: 'GET' }),

  // Assessments
  getDriveAssessment: (driveId: string) => fetchAPI(`/assessments/drive/${driveId}`, { method: 'GET' }),
  submitAssessment: (data: any) => fetchAPI('/assessments/submit', { method: 'POST', body: JSON.stringify(data) }),

  // Interviews
  getApplicationInterview: (applicationId: string) => fetchAPI(`/interviews/application/${applicationId}`, { method: 'GET' }),
  submitInterview: (interviewId: string, data: any) => fetchAPI(`/interviews/${interviewId}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  getCompanyScheduledInterviews: () => fetchAPI('/interviews/company/scheduled', { method: 'GET' }),
  scheduleInterview: (data: { application_id: string; scheduled_at: string; notes?: string }) =>
    fetchAPI('/interviews/schedule', { method: 'POST', body: JSON.stringify(data) }),

  // Scorecards
  getScorecard: (applicationId: string) => fetchAPI(`/scorecards/${applicationId}`, { method: 'GET' }),
  generateScorecard: (applicationId: string) => fetchAPI(`/scorecards/generate/${applicationId}`, { method: 'POST' }),

  // Transcription
  transcribeAudio: (formData: FormData) => fetchAPI('/interviews/transcribe', { method: 'POST', body: formData }),

  // Resume upload
  uploadResume: (formData: FormData) => fetchAPI('/students/me/resume', { method: 'POST', body: formData }),

  // Student stats & activity
  getMyStats: () => fetchAPI('/students/me/stats', { method: 'GET' }),
  getMyActivity: () => fetchAPI('/students/me/activity', { method: 'GET' }),

  // Notifications
  getNotifications: () => fetchAPI('/notifications/mine', { method: 'GET' }),
  markNotificationRead: (id: string) => fetchAPI(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => fetchAPI('/notifications/read-all', { method: 'PATCH' }),
  getUnreadNotificationCount: () => fetchAPI('/notifications/unread-count', { method: 'GET' }),

  // Admin
  getAdminCompanies: () => fetchAPI('/admin/companies', { method: 'GET' }),
  updateCompanyStatus: (id: string, status: string) =>
    fetchAPI(`/admin/companies/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getAdminStudents: () => fetchAPI('/admin/students', { method: 'GET' }),
  updateStudentStatus: (id: string, status: string) =>
    fetchAPI(`/admin/students/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getAdminDashboardStats: () => fetchAPI('/admin/dashboard/stats', { method: 'GET' }),
  getAdminAnalytics: () => fetchAPI('/admin/analytics', { method: 'GET' }),
};
