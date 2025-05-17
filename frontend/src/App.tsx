import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import MainLayout from '@/layouts/MainLayout';
import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy-loaded pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const Billing = lazy(() => import('@/pages/Billing'));
const Finance = lazy(() => import('@/pages/Finance'));
const Purchases = lazy(() => import('@/pages/Purchases'));
const Production = lazy(() => import('@/pages/Production'));
const HR = lazy(() => import('@/pages/HR'));
const CRM = lazy(() => import('@/pages/CRM'));
const Settings = lazy(() => import('@/pages/Settings'));
const Profile = lazy(() => import('@/pages/settings/Profile'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventory/*" element={<Inventory />} />
          <Route path="billing/*" element={<Billing />} />
          <Route path="finance/*" element={<Finance />} />
          <Route path="purchases/*" element={<Purchases />} />
          <Route path="production/*" element={<Production />} />
          <Route path="hr/*" element={<HR />} />
          <Route path="crm/*" element={<CRM />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App; 