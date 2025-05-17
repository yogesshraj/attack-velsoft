import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  BanknotesIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  CalculatorIcon,
  ArrowTrendingUpIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  {
    name: 'Dashboard',
    path: '/finance',
    icon: ChartBarIcon,
  },
  {
    name: 'Chart of Accounts',
    path: '/finance/chart-of-accounts',
    icon: DocumentDuplicateIcon,
  },
  {
    name: 'Journal Entries',
    path: '/finance/journal-entries',
    icon: DocumentTextIcon,
  },
  {
    name: 'General Ledger',
    path: '/finance/general-ledger',
    icon: DocumentTextIcon,
  },
  {
    name: 'Trial Balance',
    path: '/finance/trial-balance',
    icon: CalculatorIcon,
  },
  {
    name: 'Balance Sheet',
    path: '/finance/balance-sheet',
    icon: DocumentTextIcon,
  },
  {
    name: 'Profit & Loss',
    path: '/finance/profit-loss',
    icon: ArrowTrendingUpIcon,
  },
  {
    name: 'Bank Accounts',
    path: '/finance/bank-accounts',
    icon: BuildingLibraryIcon,
  },
];

const FinanceNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                  isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <item.icon
                  className={`h-5 w-5 mr-2 ${
                    isActive ? 'text-primary-500' : 'text-gray-400'
                  }`}
                />
                {item.name}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default FinanceNav; 