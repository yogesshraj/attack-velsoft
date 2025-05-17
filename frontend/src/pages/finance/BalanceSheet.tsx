import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface AccountBalance {
  id: string;
  code: string;
  name: string;
  balance: number;
}

interface BalanceSheetGroup {
  name: string;
  accounts: AccountBalance[];
  total: number;
}

interface BalanceSheetSection {
  name: string;
  groups: BalanceSheetGroup[];
  total: number;
}

interface BalanceSheetData {
  asOf: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
}

const BalanceSheet: React.FC = () => {
  const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showZeroBalances, setShowZeroBalances] = useState(false);

  // Fetch balance sheet data
  const { data, isLoading } = useQuery<BalanceSheetData>(
    ['balance-sheet', asOfDate],
    () => {
      const params = new URLSearchParams({
        asOf: asOfDate,
        includeZeroBalances: showZeroBalances.toString(),
      });
      return fetch(`/api/finance/balance-sheet?${params}`).then((res) => res.json());
    }
  );

  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/finance/balance-sheet/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asOf: asOfDate }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `balance-sheet-${format(new Date(asOfDate), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting balance sheet:', error);
      alert('Failed to export balance sheet');
    }
  };

  const renderSection = (section: BalanceSheetSection) => (
    <div className="space-y-4">
      {section.groups.map((group) => (
        <div key={group.name}>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{group.name}</h3>
          <table className="min-w-full">
            <tbody className="divide-y divide-gray-200">
              {group.accounts.map((account) => (
                <tr key={account.id}>
                  <td className="py-2 text-sm">
                    <span className="font-medium text-gray-900">{account.code}</span>
                    <span className="ml-2 text-gray-500">{account.name}</span>
                  </td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    ₹{account.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="py-2 text-sm font-medium text-gray-900">
                  Total {group.name}
                </td>
                <td className="py-2 text-sm font-medium text-right text-gray-900">
                  ₹{group.total.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between text-base font-bold text-gray-900">
          <span>Total {section.name}</span>
          <span>₹{section.total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
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

      {/* Date Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          As of Date
        </label>
        <input
          type="date"
          value={asOfDate}
          onChange={(e) => setAsOfDate(e.target.value)}
          className="input-field w-full md:w-64"
        />
      </div>

      {/* Balance Sheet Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assets */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Assets</h2>
          {data && renderSection(data.assets)}
        </div>

        {/* Liabilities and Equity */}
        <div className="space-y-8">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Liabilities</h2>
            {data && renderSection(data.liabilities)}
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Equity</h2>
            {data && renderSection(data.equity)}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="card p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Total Assets</span>
              <span>₹{data?.totalAssets.toLocaleString()}</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Total Liabilities & Equity</span>
              <span>₹{data?.totalLiabilitiesAndEquity.toLocaleString()}</span>
            </div>
          </div>
        </div>
        {Math.abs(data?.totalAssets - data?.totalLiabilitiesAndEquity) > 0.01 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600 text-center">
              Warning: Balance sheet is not balanced. Difference: ₹
              {Math.abs(
                data?.totalAssets - data?.totalLiabilitiesAndEquity
              ).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceSheet; 