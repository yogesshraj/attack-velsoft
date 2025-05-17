import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { AccountType } from '../../types/finance';

interface AccountBalance {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  debit: number;
  credit: number;
}

interface TrialBalanceData {
  accounts: AccountBalance[];
  totals: {
    debit: number;
    credit: number;
  };
  asOf: string;
}

const TrialBalance: React.FC = () => {
  const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [accountTypeFilter, setAccountTypeFilter] = useState<AccountType | 'ALL'>('ALL');

  // Fetch trial balance data
  const { data, isLoading } = useQuery<TrialBalanceData>(
    ['trial-balance', asOfDate, accountTypeFilter],
    () => {
      const params = new URLSearchParams({
        asOf: asOfDate,
        type: accountTypeFilter,
      });
      return fetch(`/api/finance/trial-balance?${params}`).then((res) => res.json());
    }
  );

  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/finance/trial-balance/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asOf: asOfDate }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trial-balance-${format(new Date(asOfDate), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting trial balance:', error);
      alert('Failed to export trial balance');
    }
  };

  const groupedAccounts = data?.accounts.reduce((groups, account) => {
    if (!groups[account.type]) {
      groups[account.type] = [];
    }
    groups[account.type].push(account);
    return groups;
  }, {} as Record<AccountType, AccountBalance[]>);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Trial Balance</h1>
        <button
          onClick={exportToCSV}
          className="btn btn-secondary flex items-center"
        >
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            As of Date
          </label>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
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

      {/* Trial Balance Table */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Account Code
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Account Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Debit
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Credit
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(groupedAccounts || {}).map(([type, accounts]) => (
              <React.Fragment key={type}>
                <tr className="bg-gray-50">
                  <td
                    colSpan={4}
                    className="px-6 py-2 text-sm font-medium text-gray-900"
                  >
                    {type}
                  </td>
                </tr>
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {account.debit > 0 ? `₹${account.debit.toLocaleString()}` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {account.credit > 0 ? `₹${account.credit.toLocaleString()}` : ''}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td
                    colSpan={2}
                    className="px-6 py-2 text-sm font-medium text-right text-gray-900"
                  >
                    Subtotal
                  </td>
                  <td className="px-6 py-2 text-sm font-medium text-right text-gray-900">
                    ₹
                    {accounts
                      .reduce((sum, account) => sum + account.debit, 0)
                      .toLocaleString()}
                  </td>
                  <td className="px-6 py-2 text-sm font-medium text-right text-gray-900">
                    ₹
                    {accounts
                      .reduce((sum, account) => sum + account.credit, 0)
                      .toLocaleString()}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr>
              <th
                colSpan={2}
                scope="row"
                className="px-6 py-3 text-right text-sm font-bold text-gray-900"
              >
                Total
              </th>
              <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                ₹{data?.totals.debit.toLocaleString()}
              </td>
              <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                ₹{data?.totals.credit.toLocaleString()}
              </td>
            </tr>
            {Math.abs(data?.totals.debit - data?.totals.credit) > 0.01 && (
              <tr className="bg-red-50">
                <td colSpan={4} className="px-6 py-3 text-center text-sm text-red-600">
                  Warning: Trial balance is not balanced. Difference: ₹
                  {Math.abs(data?.totals.debit - data?.totals.credit).toLocaleString()}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default TrialBalance; 