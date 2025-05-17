import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface AccountBalance {
  id: string;
  code: string;
  name: string;
  currentBalance: number;
  previousBalance: number;
  change: number;
  changePercentage: number;
}

interface PLGroup {
  name: string;
  accounts: AccountBalance[];
  currentTotal: number;
  previousTotal: number;
  change: number;
  changePercentage: number;
}

interface PLSection {
  name: string;
  groups: PLGroup[];
  currentTotal: number;
  previousTotal: number;
  change: number;
  changePercentage: number;
}

interface ProfitLossData {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  revenue: PLSection;
  expenses: PLSection;
  netIncome: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  };
}

const ProfitLoss: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [showZeroBalances, setShowZeroBalances] = useState(false);

  // Fetch profit & loss data
  const { data, isLoading } = useQuery<ProfitLossData>(
    ['profit-loss', dateRange],
    () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        includeZeroBalances: showZeroBalances.toString(),
      });
      return fetch(`/api/finance/profit-loss?${params}`).then((res) => res.json());
    }
  );

  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/finance/profit-loss/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dateRange),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profit-loss-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting profit & loss statement:', error);
      alert('Failed to export profit & loss statement');
    }
  };

  const renderChangeIndicator = (change: number, percentage: number) => {
    const color = change >= 0 ? 'text-green-600' : 'text-red-600';
    const sign = change >= 0 ? '+' : '';
    return (
      <span className={color}>
        {sign}
        {percentage.toFixed(1)}%
      </span>
    );
  };

  const renderSection = (section: PLSection) => (
    <div className="space-y-6">
      {section.groups.map((group) => (
        <div key={group.name}>
          <h3 className="text-lg font-medium text-gray-900 mb-4">{group.name}</h3>
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 pb-2">
                  Account
                </th>
                <th className="text-right text-sm font-medium text-gray-500 pb-2">
                  Current Period
                </th>
                <th className="text-right text-sm font-medium text-gray-500 pb-2">
                  Previous Period
                </th>
                <th className="text-right text-sm font-medium text-gray-500 pb-2">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {group.accounts.map((account) => (
                <tr key={account.id}>
                  <td className="py-3 text-sm">
                    <span className="font-medium text-gray-900">{account.code}</span>
                    <span className="ml-2 text-gray-500">{account.name}</span>
                  </td>
                  <td className="py-3 text-sm text-right text-gray-900">
                    ₹{account.currentBalance.toLocaleString()}
                  </td>
                  <td className="py-3 text-sm text-right text-gray-900">
                    ₹{account.previousBalance.toLocaleString()}
                  </td>
                  <td className="py-3 text-sm text-right">
                    {renderChangeIndicator(account.change, account.changePercentage)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium">
                <td className="py-3 text-sm text-gray-900">Total {group.name}</td>
                <td className="py-3 text-sm text-right text-gray-900">
                  ₹{group.currentTotal.toLocaleString()}
                </td>
                <td className="py-3 text-sm text-right text-gray-900">
                  ₹{group.previousTotal.toLocaleString()}
                </td>
                <td className="py-3 text-sm text-right">
                  {renderChangeIndicator(group.change, group.changePercentage)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-4 text-base font-bold text-gray-900">
          <div>Total {section.name}</div>
          <div className="text-right">₹{section.currentTotal.toLocaleString()}</div>
          <div className="text-right">₹{section.previousTotal.toLocaleString()}</div>
          <div className="text-right">
            {renderChangeIndicator(section.change, section.changePercentage)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Profit & Loss Statement</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showZeroBalances}
              onChange={(e) => setShowZeroBalances(e.target.checked)}
              className="form-checkbox h-4 w-4 text-primary-600"
            />
            <span className="ml-2 text-sm text-gray-700">Show zero balances</span>
          </label>
          <button
            onClick={exportToCSV}
            className="btn btn-secondary flex items-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, startDate: e.target.value })
            }
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
      </div>

      {/* Quick Date Range Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const now = new Date();
            setDateRange({
              startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
              endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
            });
          }}
          className="btn btn-secondary text-sm"
        >
          This Month
        </button>
        <button
          onClick={() => {
            const now = new Date();
            const lastMonth = subMonths(now, 1);
            setDateRange({
              startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
              endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
            });
          }}
          className="btn btn-secondary text-sm"
        >
          Last Month
        </button>
        <button
          onClick={() => {
            const now = new Date();
            setDateRange({
              startDate: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'),
              endDate: format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd'),
            });
          }}
          className="btn btn-secondary text-sm"
        >
          This Year
        </button>
        <button
          onClick={() => {
            const now = new Date();
            setDateRange({
              startDate: format(
                new Date(now.getFullYear() - 1, 0, 1),
                'yyyy-MM-dd'
              ),
              endDate: format(
                new Date(now.getFullYear() - 1, 11, 31),
                'yyyy-MM-dd'
              ),
            });
          }}
          className="btn btn-secondary text-sm"
        >
          Last Year
        </button>
      </div>

      {/* Period Info */}
      {data && (
        <div className="text-sm text-gray-500">
          Current Period: {format(new Date(data.startDate), 'dd/MM/yyyy')} to{' '}
          {format(new Date(data.endDate), 'dd/MM/yyyy')}
          <br />
          Previous Period: {format(new Date(data.previousStartDate), 'dd/MM/yyyy')}{' '}
          to {format(new Date(data.previousEndDate), 'dd/MM/yyyy')}
        </div>
      )}

      {/* P&L Content */}
      <div className="space-y-8">
        {/* Revenue */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue</h2>
          {data && renderSection(data.revenue)}
        </div>

        {/* Expenses */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Expenses</h2>
          {data && renderSection(data.expenses)}
        </div>

        {/* Net Income */}
        <div className="card p-6">
          <div className="grid grid-cols-4 text-lg font-bold">
            <div className="text-gray-900">Net Income</div>
            <div className="text-right text-gray-900">
              ₹{data?.netIncome.current.toLocaleString()}
            </div>
            <div className="text-right text-gray-900">
              ₹{data?.netIncome.previous.toLocaleString()}
            </div>
            <div className="text-right">
              {data &&
                renderChangeIndicator(
                  data.netIncome.change,
                  data.netIncome.changePercentage
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLoss; 