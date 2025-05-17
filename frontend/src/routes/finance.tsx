import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const Dashboard = lazy(() => import('../pages/finance/Dashboard'));
const ChartOfAccounts = lazy(() => import('../pages/finance/ChartOfAccounts'));
const JournalEntries = lazy(() => import('../pages/finance/JournalEntries'));
const GeneralLedger = lazy(() => import('../pages/finance/GeneralLedger'));
const TrialBalance = lazy(() => import('../pages/finance/TrialBalance'));
const BalanceSheet = lazy(() => import('../pages/finance/BalanceSheet'));
const ProfitLoss = lazy(() => import('../pages/finance/ProfitLoss'));
const BankAccounts = lazy(() => import('../pages/finance/BankAccounts'));

export const financeRoutes: RouteObject[] = [
  {
    path: 'finance',
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'chart-of-accounts',
        element: <ChartOfAccounts />,
      },
      {
        path: 'journal-entries',
        element: <JournalEntries />,
      },
      {
        path: 'general-ledger',
        element: <GeneralLedger />,
      },
      {
        path: 'trial-balance',
        element: <TrialBalance />,
      },
      {
        path: 'balance-sheet',
        element: <BalanceSheet />,
      },
      {
        path: 'profit-loss',
        element: <ProfitLoss />,
      },
      {
        path: 'bank-accounts',
        element: <BankAccounts />,
      },
    ],
  },
]; 