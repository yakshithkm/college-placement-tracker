import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/global.css';

// Layouts
import AppLayout from './components/common/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ResumePage from './pages/ResumePage';
import ProjectsPage from './pages/ProjectsPage';
import CertificationsPage from './pages/CertificationsPage';
import AptitudePage from './pages/AptitudePage';
import InterviewPage from './pages/InterviewPage';
import ApplicationsPage from './pages/ApplicationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DrivesPage from './pages/DrivesPage';
import AdminPage from './pages/AdminPage';
import CoordinatorPage from './pages/CoordinatorPage';

// Aptitude Test Module (new quiz system — distinct from legacy /aptitude manual-score page)
import AptitudeTestListPage from './pages/quiz/AptitudeTestListPage';
import QuizTakingPage from './pages/quiz/QuizTakingPage';
import QuizResultPage from './pages/quiz/QuizResultPage';
import QuizHistoryPage from './pages/quiz/QuizHistoryPage';
import AdminQuestionsPage from './pages/quiz/AdminQuestionsPage';
import AdminTestsPage from './pages/quiz/AdminTestsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
    mutations: { retry: 0 },
  },
});

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/resumes" element={<PrivateRoute roles={['student']}><ResumePage /></PrivateRoute>} />
        <Route path="/projects" element={<PrivateRoute roles={['student']}><ProjectsPage /></PrivateRoute>} />
        <Route path="/certifications" element={<PrivateRoute roles={['student']}><CertificationsPage /></PrivateRoute>} />
        <Route path="/aptitude" element={<PrivateRoute roles={['student']}><AptitudePage /></PrivateRoute>} />

        {/* Aptitude Test Module (quizzes) — students */}
        <Route path="/aptitude-tests" element={<PrivateRoute roles={['student']}><AptitudeTestListPage /></PrivateRoute>} />
        <Route path="/aptitude-tests/take/:testId" element={<PrivateRoute roles={['student']}><QuizTakingPage /></PrivateRoute>} />
        <Route path="/aptitude-tests/result/:attemptId" element={<PrivateRoute roles={['student', 'coordinator', 'admin']}><QuizResultPage /></PrivateRoute>} />
        <Route path="/aptitude-tests/history" element={<PrivateRoute roles={['student']}><QuizHistoryPage /></PrivateRoute>} />

        {/* Aptitude Test Module — admin/coordinator management */}
        <Route path="/aptitude-tests/admin/questions" element={<PrivateRoute roles={['admin', 'coordinator']}><AdminQuestionsPage /></PrivateRoute>} />
        <Route path="/aptitude-tests/admin/tests" element={<PrivateRoute roles={['admin', 'coordinator']}><AdminTestsPage /></PrivateRoute>} />

        <Route path="/interviews" element={<PrivateRoute roles={['student']}><InterviewPage /></PrivateRoute>} />
        <Route path="/applications" element={<PrivateRoute roles={['student']}><ApplicationsPage /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute roles={['student']}><AnalyticsPage /></PrivateRoute>} />
        <Route path="/drives" element={<DrivesPage />} />
        <Route path="/coordinator" element={<PrivateRoute roles={['coordinator', 'admin']}><CoordinatorPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminPage /></PrivateRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{
            duration: 3500,
            style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
          }} />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}