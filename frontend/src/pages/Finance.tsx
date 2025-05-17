import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Lazy-loaded finance components
const Dashboard = lazy(() => import('./finance/Dashboard'));
const ChartOfAccounts = lazy(() => import('./finance/ChartOfAccounts'));
const JournalEntries = lazy(() => import('./finance/JournalEntries'));
const GeneralLedger = lazy(() => import('./finance/GeneralLedger'));
const TrialBalance = lazy(() => import('./finance/TrialBalance'));
const BalanceSheet = lazy(() => import('./finance/BalanceSheet'));
const ProfitLoss = lazy(() => import('./finance/ProfitLoss'));
const BankAccounts = lazy(() => import('./finance/BankAccounts'));
const Reports = lazy(() => import('./finance/Reports'));

const Finance: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="chart-of-accounts/*" element={<ChartOfAccounts />} />
        <Route path="journal-entries/*" element={<JournalEntries />} />
        <Route path="general-ledger" element={<GeneralLedger />} />
        <Route path="trial-balance" element={<TrialBalance />} />
        <Route path="balance-sheet" element={<BalanceSheet />} />
        <Route path="profit-loss" element={<ProfitLoss />} />
        <Route path="bank-accounts/*" element={<BankAccounts />} />
        <Route path="reports" element={<Reports />} />
      </Routes>
    </Suspense>
  );
};

export default Finance; 