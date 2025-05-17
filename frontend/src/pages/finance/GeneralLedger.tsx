import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { AccountType } from '../../types/finance';

interface Transaction {
  id: string;
  date: string;
  type: string;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
  transactions: Transaction[];
}

const GeneralLedger: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [accountTypeFilter, setAccountTypeFilter] = useState<AccountType | 'ALL'>('ALL');

  // Fetch accounts with transactions
  const { data: accounts, isLoading } = useQuery<Account[]>(
    ['general-ledger', dateRange, accountTypeFilter],
    () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      if (accountTypeFilter !== 'ALL') params.append('type', accountTypeFilter);
      return fetch(`/api/finance/general-ledger?${params}`).then((res) => res.json());
    }
  );

  const toggleExpand = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/finance/general-ledger/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `general-ledger-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting general ledger:', error);
      alert('Failed to export general ledger');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
        <button
          onClick={exportToCSV}
          className="btn btn-secondary flex items-center"
        >
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Type
          </label>
          <select
            value={accountTypeFilter}
            onChange={(e) => setAccountTypeFilter(e.target.value as AccountType | 'ALL')}
            className="input-field w-full"
          >
            <option value="ALL">All Types</option>
            <option value="ASSET">Asset</option>
            <option value="LIABILITY">Liability</option>
            <option value="EQUITY">Equity</option>
            <option value="REVENUE">Revenue</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>
      </div>

      {/* Accounts List */}
      <div className="card overflow-hidden">
        <div className="bg-gray-50 p-4 grid grid-cols-5 gap-4 text-sm font-medium text-gray-500">
          <div className="col-span-2">Account</div>
          <div className="text-right">Debit</div>
          <div className="text-right">Credit</div>
          <div className="text-right">Balance</div>
        </div>
        <div className="divide-y divide-gray-200">
          {accounts?.map((account) => (
            <React.Fragment key={account.id}>
              <div
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedAccount === account.id ? 'bg-gray-50' : ''
                }`}
                onClick={() => toggleExpand(account.id)}
              >
                <div className="grid grid-cols-5 gap-4">
                  <div className="col-span-2 flex items-center">
                    {account.transactions.length > 0 ? (
                      expandedAccounts.has(account.id) ? (
                        <ChevronDownIcon className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 mr-2" />
                      )
                    ) : (
                      <div className="w-6" />
                    )}
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="font-medium text-gray-900">{account.code}</div>
                      <div className="text-sm text-gray-500">{account.name}</div>
                    </div>
                  </div>
                  <div className="text-right font-medium text-gray-900">
                    {account.transactions.reduce(
                      (sum, t) => sum + t.debit,
                      0
                    ).toLocaleString()}
                  </div>
                  <div className="text-right font-medium text-gray-900">
                    {account.transactions.reduce(
                      (sum, t) => sum + t.credit,
                      0
                    ).toLocaleString()}
                  </div>
                  <div className="text-right font-medium text-gray-900">
                    ₹{account.balance.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Transactions */}
              {expandedAccounts.has(account.id) && (
                <div className="bg-gray-50 p-4">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase">
                          Description
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase">
                          Reference
                        </th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase">
                          Debit
                        </th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase">
                          Credit
                        </th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {account.transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="py-2 text-sm text-gray-900">
                            {format(new Date(transaction.date), 'dd/MM/yyyy')}
                          </td>
                          <td className="py-2 text-sm text-gray-900">
                            {transaction.description}
                          </td>
                          <td className="py-2 text-sm text-gray-500">
                            {transaction.reference}
                          </td>
                          <td className="py-2 text-right text-sm text-gray-900">
                            {transaction.debit > 0
                              ? `₹${transaction.debit.toLocaleString()}`
                              : ''}
                          </td>
                          <td className="py-2 text-right text-sm text-gray-900">
                            {transaction.credit > 0
                              ? `₹${transaction.credit.toLocaleString()}`
                              : ''}
                          </td>
                          <td className="py-2 text-right text-sm font-medium text-gray-900">
                            ₹{transaction.balance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeneralLedger; 