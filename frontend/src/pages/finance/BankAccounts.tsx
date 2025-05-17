import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  reference?: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  balance: number;
  reconciled: boolean;
}

interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  balance: number;
  lastReconciled?: string;
  transactions: BankTransaction[];
}

const BankAccounts: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const queryClient = useQueryClient();

  // Fetch bank accounts
  const { data: accounts, isLoading } = useQuery<BankAccount[]>(
    ['bank-accounts'],
    () => fetch('/api/finance/bank-accounts').then((res) => res.json())
  );

  // Fetch transactions for selected account
  const { data: transactions } = useQuery<BankTransaction[]>(
    ['bank-transactions', selectedAccount, dateRange],
    () => {
      if (!selectedAccount) return null;
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      return fetch(
        `/api/finance/bank-accounts/${selectedAccount}/transactions?${params}`
      ).then((res) => res.json());
    },
    { enabled: !!selectedAccount }
  );

  // Create bank account mutation
  const createAccountMutation = useMutation(
    (data: {
      name: string;
      accountNumber: string;
      bankName: string;
      openingBalance: number;
    }) =>
      fetch('/api/finance/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bank-accounts']);
        setIsCreateModalOpen(false);
      },
    }
  );

  // Transfer funds mutation
  const transferFundsMutation = useMutation(
    (data: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      description: string;
      date: string;
    }) =>
      fetch('/api/finance/bank-accounts/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bank-accounts']);
        queryClient.invalidateQueries(['bank-transactions']);
        setIsTransferModalOpen(false);
      },
    }
  );

  // Reconcile transaction mutation
  const reconcileTransactionMutation = useMutation(
    (data: { accountId: string; transactionId: string; reconciled: boolean }) =>
      fetch(
        `/api/finance/bank-accounts/${data.accountId}/transactions/${data.transactionId}/reconcile`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reconciled: data.reconciled }),
        }
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bank-transactions']);
      },
    }
  );

  const exportTransactions = async () => {
    if (!selectedAccount) return;
    try {
      const response = await fetch(
        `/api/finance/bank-accounts/${selectedAccount}/transactions/export`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dateRange),
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bank-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Failed to export transactions');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="btn btn-secondary flex items-center"
          >
            <ArrowRightIcon className="h-5 w-5 mr-2" />
            Transfer Funds
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Account
          </button>
        </div>
      </div>

      {/* Bank Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts?.map((account) => (
          <div
            key={account.id}
            className={`card p-6 cursor-pointer transition-colors ${
              selectedAccount === account.id ? 'ring-2 ring-primary-500' : ''
            }`}
            onClick={() => setSelectedAccount(account.id)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{account.name}</h3>
                <p className="text-sm text-gray-500">{account.bankName}</p>
                <p className="text-sm text-gray-500">
                  Account: {account.accountNumber}
                </p>
              </div>
              <BanknotesIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">
                ₹{account.balance.toLocaleString()}
              </div>
              {account.lastReconciled && (
                <p className="text-sm text-gray-500 mt-1">
                  Last reconciled:{' '}
                  {format(new Date(account.lastReconciled), 'dd/MM/yyyy')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Section */}
      {selectedAccount && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Transactions</h2>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  queryClient.invalidateQueries(['bank-transactions', selectedAccount])
                }
                className="btn btn-secondary flex items-center"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Refresh
              </button>
              <button
                onClick={exportTransactions}
                className="btn btn-secondary flex items-center"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Reference
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Balance
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Reconciled
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions?.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(transaction.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.reference}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                        transaction.type === 'CREDIT'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'CREDIT' ? '+' : '-'}₹
                      {Math.abs(transaction.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      ₹{transaction.balance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={transaction.reconciled}
                        onChange={(e) =>
                          reconcileTransactionMutation.mutate({
                            accountId: selectedAccount,
                            transactionId: transaction.id,
                            reconciled: e.target.checked,
                          })
                        }
                        className="form-checkbox h-4 w-4 text-primary-600"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      <Dialog open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Add Bank Account
            </Dialog.Title>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createAccountMutation.mutate({
                  name: formData.get('name') as string,
                  accountNumber: formData.get('accountNumber') as string,
                  bankName: formData.get('bankName') as string,
                  openingBalance: parseFloat(formData.get('openingBalance') as string),
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="input-field w-full"
                  placeholder="e.g., Business Current Account"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankName"
                  required
                  className="input-field w-full"
                  placeholder="e.g., HDFC Bank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  required
                  className="input-field w-full"
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Balance
                </label>
                <input
                  type="number"
                  name="openingBalance"
                  required
                  step="0.01"
                  className="input-field w-full"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Account
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Transfer Funds Modal */}
      <Dialog open={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Transfer Funds
            </Dialog.Title>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                transferFundsMutation.mutate({
                  fromAccountId: formData.get('fromAccount') as string,
                  toAccountId: formData.get('toAccount') as string,
                  amount: parseFloat(formData.get('amount') as string),
                  description: formData.get('description') as string,
                  date: formData.get('date') as string,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Account
                </label>
                <select name="fromAccount" required className="input-field w-full">
                  <option value="">Select account</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (₹{account.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Account
                </label>
                <select name="toAccount" required className="input-field w-full">
                  <option value="">Select account</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (₹{account.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  step="0.01"
                  className="input-field w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  required
                  className="input-field w-full"
                  placeholder="Enter transfer description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={format(new Date(), 'yyyy-MM-dd')}
                  className="input-field w-full"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Transfer
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default BankAccounts; 