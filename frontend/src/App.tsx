import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
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
const Login = lazy(() => import('@/pages/Login'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route path="/" element={<MainLayout />}>
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
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App; 