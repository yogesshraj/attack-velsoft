import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  PlusIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { TransactionType } from '../../types/finance';

interface JournalEntry {
  id: string;
  accountId: string;
  account: {
    code: string;
    name: string;
  };
  debit: number;
  credit: number;
  description?: string;
}

interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  description: string;
  reference?: string;
  amount: number;
  entries: JournalEntry[];
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

interface TransactionFormData {
  date: string;
  type: TransactionType;
  description: string;
  reference?: string;
  entries: {
    accountId: string;
    debit: number;
    credit: number;
    description?: string;
  }[];
}

const JournalEntries: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [selectedType, setSelectedType] = useState<TransactionType | 'ALL'>('ALL');
  const [entries, setEntries] = useState<
    { accountId: string; debit: number; credit: number; description?: string }[]
  >([{ accountId: '', debit: 0, credit: 0 }]);

  const queryClient = useQueryClient();

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>(
    ['transactions', dateRange, selectedType],
    () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      if (selectedType !== 'ALL') params.append('type', selectedType);
      return fetch(`/api/finance/transactions?${params}`).then((res) => res.json());
    }
  );

  // Fetch accounts for dropdown
  const { data: accounts } = useQuery(['accounts'], () =>
    fetch('/api/finance/accounts').then((res) => res.json())
  );

  // Create transaction mutation
  const createTransactionMutation = useMutation(
    (data: TransactionFormData) =>
      fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['transactions']);
        setIsCreateModalOpen(false);
        setEntries([{ accountId: '', debit: 0, credit: 0 }]);
      },
    }
  );

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation(
    (id: string) =>
      fetch(`/api/finance/transactions/${id}`, {
        method: 'DELETE',
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['transactions']);
      },
    }
  );

  const addEntry = () => {
    setEntries([...entries, { accountId: '', debit: 0, credit: 0 }]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (
    index: number,
    field: 'accountId' | 'debit' | 'credit' | 'description',
    value: string | number
  ) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const validateEntries = () => {
    const totalDebits = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredits = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
    return Math.abs(totalDebits - totalCredits) < 0.01;
  };

  const filteredTransactions = transactions?.filter(
    (transaction) =>
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Entry
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transactions..."
            className="input-field w-full"
          />
        </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as TransactionType | 'ALL')}
            className="input-field w-full"
          >
            <option value="ALL">All Types</option>
            <option value="JOURNAL_ENTRY">Journal Entry</option>
            <option value="INVOICE_PAYMENT">Invoice Payment</option>
            <option value="PURCHASE_PAYMENT">Purchase Payment</option>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reference
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions?.map((transaction) => (
              <React.Fragment key={transaction.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(transaction.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    ₹{transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            'Are you sure you want to delete this transaction? This action cannot be undone.'
                          )
                        ) {
                          deleteTransactionMutation.mutate(transaction.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan={6} className="px-6 py-4">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase">
                            Account
                          </th>
                          <th className="text-right text-xs font-medium text-gray-500 uppercase">
                            Debit
                          </th>
                          <th className="text-right text-xs font-medium text-gray-500 uppercase">
                            Credit
                          </th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaction.entries.map((entry) => (
                          <tr key={entry.id}>
                            <td className="text-sm text-gray-900">
                              {entry.account.code} - {entry.account.name}
                            </td>
                            <td className="text-right text-sm text-gray-900">
                              {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : ''}
                            </td>
                            <td className="text-right text-sm text-gray-900">
                              {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : ''}
                            </td>
                            <td className="text-sm text-gray-500">{entry.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Transaction Modal */}
      <Dialog open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              New Journal Entry
            </Dialog.Title>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!validateEntries()) {
                  alert('Total debits must equal total credits');
                  return;
                }
                const formData = new FormData(e.currentTarget);
                createTransactionMutation.mutate({
                  date: formData.get('date') as string,
                  type: formData.get('type') as TransactionType,
                  description: formData.get('description') as string,
                  reference: formData.get('reference') as string,
                  entries,
                });
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select name="type" required className="input-field w-full">
                    <option value="JOURNAL_ENTRY">Journal Entry</option>
                    <option value="INVOICE_PAYMENT">Invoice Payment</option>
                    <option value="PURCHASE_PAYMENT">Purchase Payment</option>
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference
                </label>
                <input type="text" name="reference" className="input-field w-full" />
              </div>

              {/* Journal Entries */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Journal Entries
                  </label>
                  <button
                    type="button"
                    onClick={addEntry}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {entries.map((entry, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-4">
                        <select
                          value={entry.accountId}
                          onChange={(e) =>
                            updateEntry(index, 'accountId', e.target.value)
                          }
                          required
                          className="input-field w-full"
                        >
                          <option value="">Select Account</option>
                          {accounts?.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={entry.debit || ''}
                          onChange={(e) =>
                            updateEntry(index, 'debit', parseFloat(e.target.value) || 0)
                          }
                          placeholder="Debit"
                          className="input-field w-full"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={entry.credit || ''}
                          onChange={(e) =>
                            updateEntry(index, 'credit', parseFloat(e.target.value) || 0)
                          }
                          placeholder="Credit"
                          className="input-field w-full"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={entry.description || ''}
                          onChange={(e) =>
                            updateEntry(index, 'description', e.target.value)
                          }
                          placeholder="Description"
                          className="input-field w-full"
                        />
                      </div>
                      <div className="col-span-1">
                        {entries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEntry(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right text-sm">
                  Total Debit: ₹
                  {entries
                    .reduce((sum, entry) => sum + (entry.debit || 0), 0)
                    .toLocaleString()}
                  <br />
                  Total Credit: ₹
                  {entries
                    .reduce((sum, entry) => sum + (entry.credit || 0), 0)
                    .toLocaleString()}
                </div>
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
                  Create Entry
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default JournalEntries; 