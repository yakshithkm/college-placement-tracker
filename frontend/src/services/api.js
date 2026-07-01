import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Resolves relative file paths (like /uploads/xyz.pdf) into a URL the browser can
// actually navigate to. In dev, CRA's proxy middleware skips full-page navigations
// (Accept: text/html), so we point straight at the backend. In production, Nginx
// already proxies /uploads/ correctly, so relative paths work as-is.
export const getFileUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const isDev = process.env.NODE_ENV === 'development';
  const backendOrigin = isDev ? 'http://localhost:5000' : '';
  return `${backendOrigin}${path}`;
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        refreshQueue.forEach(({ resolve }) => resolve(accessToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        refreshQueue.forEach(({ reject }) => reject(error));
        refreshQueue = [];
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    const message = error.response?.data?.message || 'Something went wrong';
    if (error.response?.status !== 401) toast.error(message);
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Analytics
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getMyAnalytics: () => api.get('/analytics/me'),
  refresh: () => api.post('/analytics/refresh'),
  getCoordinatorStats: () => api.get('/analytics/coordinator'),
};

// Students
export const studentsAPI = {
  getProfile: () => api.get('/students/me'),
  updateProfile: (data) => api.put('/students/me', data),
  getAllStudents: (params) => api.get('/students', { params }),
  getSkills: () => api.get('/students/me/skills'),
  addSkill: (data) => api.post('/students/me/skills', data),
  removeSkill: (id) => api.delete(`/students/me/skills/${id}`),
  getSemesters: () => api.get('/students/me/semesters'),
  addSemester: (data) => api.post('/students/me/semesters', data),
};

// Resumes
export const resumesAPI = {
  getAll: () => api.get('/resumes'),
  upload: (formData) => api.post('/resumes', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  setActive: (id) => api.put(`/resumes/${id}/activate`),
  delete: (id) => api.delete(`/resumes/${id}`),
};

// Projects
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Certifications
export const certsAPI = {
  getAll: () => api.get('/certifications'),
  create: (data) => api.post('/certifications', data),
  update: (id, data) => api.put(`/certifications/${id}`, data),
  delete: (id) => api.delete(`/certifications/${id}`),
};

// Aptitude
export const aptitudeAPI = {
  getAll: () => api.get('/aptitude'),
  create: (data) => api.post('/aptitude', data),
  delete: (id) => api.delete(`/aptitude/${id}`),
};

// Interviews
export const interviewsAPI = {
  getAll: () => api.get('/interviews'),
  create: (data) => api.post('/interviews', data),
  delete: (id) => api.delete(`/interviews/${id}`),
};

// Applications
export const applicationsAPI = {
  getAll: (params) => api.get('/applications', { params }),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`),
};

// Companies
export const companiesAPI = {
  getAll: (params) => api.get('/companies', { params }),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};

// Drives
export const drivesAPI = {
  getAll: (params) => api.get('/drives', { params }),
  getById: (id) => api.get(`/drives/${id}`),
  create: (data) => api.post('/drives', data),
  update: (id, data) => api.put(`/drives/${id}`, data),
  delete: (id) => api.delete(`/drives/${id}`),
  getApplicants: (id) => api.get(`/drives/${id}/applicants`),
};

// Aptitude Test Module (quizzes — distinct from the legacy manual-score aptitudeAPI above)
export const aptitudeTestAPI = {
  // Categories
  getCategories: () => api.get('/aptitude-test/categories'),
  createCategory: (data) => api.post('/aptitude-test/categories', data),
  updateCategory: (id, data) => api.put(`/aptitude-test/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/aptitude-test/categories/${id}`),

  // Questions (admin)
  getQuestions: (params) => api.get('/aptitude-test/questions', { params }),
  createQuestion: (data) => api.post('/aptitude-test/questions', data),
  updateQuestion: (id, data) => api.put(`/aptitude-test/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/aptitude-test/questions/${id}`),
  bulkImportQuestions: (questions) => api.post('/aptitude-test/questions/bulk-import', { questions }),

  // Tests
  getTests: (params) => api.get('/aptitude-test/tests', { params }),
  getTestById: (id) => api.get(`/aptitude-test/tests/${id}`),
  createTest: (data) => api.post('/aptitude-test/tests', data),
  updateTest: (id, data) => api.put(`/aptitude-test/tests/${id}`, data),
  deleteTest: (id) => api.delete(`/aptitude-test/tests/${id}`),

  // Attempts (student)
  startAttempt: (data) => api.post('/aptitude-test/attempt/start', data),
  saveAnswer: (attemptId, data) => api.put(`/aptitude-test/attempt/${attemptId}/answer`, data),
  submitAttempt: (attemptId, data) => api.post(`/aptitude-test/attempt/${attemptId}/submit`, data),
  getAttemptResult: (attemptId) => api.get(`/aptitude-test/attempt/${attemptId}/result`),

  // Analytics
  getMyAttempts: () => api.get('/aptitude-test/my-attempts'),
  getAdminStats: () => api.get('/aptitude-test/admin/stats'),
};

export default api;