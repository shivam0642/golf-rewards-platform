import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import HowItWorksPage from './pages/HowItWorksPage';
import CharitiesPage from './pages/CharitiesPage';
import CharityDetailPage from './pages/CharityDetailPage';
import DrawPage from './pages/DrawPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ScoresPage from './pages/ScoresPage';
import SubscriptionPage from './pages/SubscriptionPage';
import CharityPage from './pages/CharityPage';
import DrawsPage from './pages/DrawsPage';
import WinningsPage from './pages/WinningsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminSubscriptionsPage from './pages/AdminSubscriptionsPage';
import AdminDrawsPage from './pages/AdminDrawsPage';
import AdminCharitiesPage from './pages/AdminCharitiesPage';
import AdminWinnersPage from './pages/AdminWinnersPage';
import AdminReportsPage from './pages/AdminReportsPage';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMINISTRATOR') return <Navigate to="/dashboard" replace />;

  return children;
}

function AppRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/charities" element={<CharitiesPage />} />
        <Route path="/charities/:id" element={<CharityDetailPage />} />
        <Route path="/draw" element={<DrawPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/scores" element={<ProtectedRoute><ScoresPage /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
        <Route path="/charity" element={<ProtectedRoute><CharityPage /></ProtectedRoute>} />
        <Route path="/draws" element={<ProtectedRoute><DrawsPage /></ProtectedRoute>} />
        <Route path="/winnings" element={<ProtectedRoute><WinningsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/subscriptions" element={<ProtectedRoute adminOnly><AdminSubscriptionsPage /></ProtectedRoute>} />
        <Route path="/admin/draws" element={<ProtectedRoute adminOnly><AdminDrawsPage /></ProtectedRoute>} />
        <Route path="/admin/charities" element={<ProtectedRoute adminOnly><AdminCharitiesPage /></ProtectedRoute>} />
        <Route path="/admin/winners" element={<ProtectedRoute adminOnly><AdminWinnersPage /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute adminOnly><AdminReportsPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <AppRoutes />
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
