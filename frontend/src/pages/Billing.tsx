import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';

const InvoiceList = lazy(() => import('./invoices/InvoiceList'));
const InvoiceForm = lazy(() => import('./invoices/InvoiceForm'));
const InvoiceDetail = lazy(() => import('./invoices/InvoiceDetail'));

const Billing: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route index element={<Navigate to="invoices" replace />} />
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="invoices/new" element={<InvoiceForm />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="invoices/:id/edit" element={<InvoiceForm />} />
      </Routes>
    </Suspense>
  );
};

export default Billing; 