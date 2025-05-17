import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { AccountType } from '../../types/finance';

interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  balance: number;
  parentId?: string;
  subAccounts: Account[];
  createdAt: string;
  updatedAt: string;
}

interface AccountFormData {
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  parentId?: string;
}

const ChartOfAccounts: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<AccountType | 'ALL'>('ALL');

  const queryClient = useQueryClient();

  // Fetch accounts
  const { data: accounts, isLoading } = useQuery<Account[]>(['accounts'], () =>
    fetch('/api/finance/accounts').then((res) => res.json())
  );

  // Create account mutation
  const createAccountMutation = useMutation(
    (data: AccountFormData) =>
      fetch('/api/finance/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['accounts']);
        setIsCreateModalOpen(false);
      },
    }
  );

  // Update account mutation
  const updateAccountMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<AccountFormData> }) =>
      fetch(`/api/finance/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['accounts']);
        setIsEditModalOpen(false);
      },
    }
  );

  // Delete account mutation
  const deleteAccountMutation = useMutation(
    (id: string) =>
      fetch(`/api/finance/accounts/${id}`, {
        method: 'DELETE',
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['accounts']);
      },
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

  const renderAccount = (account: Account, level: number = 0) => {
    const isExpanded = expandedAccounts.has(account.id);

    return (
      <div key={account.id}>
        <div
          className={`flex items-center p-4 hover:bg-gray-50 ${
            level > 0 ? 'pl-' + (level * 8 + 4) + 'px' : ''
          }`}
        >
          <button
            onClick={() => toggleExpand(account.id)}
            className={`mr-2 ${account.subAccounts.length === 0 ? 'invisible' : ''}`}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
          <div className="flex-1 grid grid-cols-6 gap-4">
            <div className="col-span-2 flex items-center">
              <span className="font-medium">{account.code}</span>
              <span className="ml-2 text-gray-600">{account.name}</span>
            </div>
            <div className="text-gray-600">{account.type}</div>
            <div className="text-right font-medium">₹{account.balance.toLocaleString()}</div>
            <div className="text-gray-500">{account.description}</div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setSelectedAccount(account);
                  setIsEditModalOpen(true);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Are you sure you want to delete this account? This action cannot be undone.'
                    )
                  ) {
                    deleteAccountMutation.mutate(account.id);
                  }
                }}
                className="text-gray-400 hover:text-red-500"
                disabled={account.subAccounts.length > 0}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        {isExpanded &&
          account.subAccounts.map((subAccount) => renderAccount(subAccount, level + 1))}
      </div>
    );
  };

  const filteredAccounts = accounts?.filter((account) => {
    const matchesSearch =
      searchTerm === '' ||
      account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || account.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Account
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code or name..."
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AccountType | 'ALL')}
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
        <div className="bg-gray-50 p-4 grid grid-cols-6 gap-4 text-sm font-medium text-gray-500">
          <div className="col-span-2">Account</div>
          <div>Type</div>
          <div className="text-right">Balance</div>
          <div>Description</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredAccounts?.map((account) => renderAccount(account))}
        </div>
      </div>

      {/* Create Account Modal */}
      <Dialog open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Create New Account
            </Dialog.Title>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createAccountMutation.mutate({
                  code: formData.get('code') as string,
                  name: formData.get('name') as string,
                  type: formData.get('type') as AccountType,
                  description: formData.get('description') as string,
                  parentId: formData.get('parentId') as string,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Code
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <select name="type" required className="input-field w-full">
                  <option value="ASSET">Asset</option>
                  <option value="LIABILITY">Liability</option>
                  <option value="EQUITY">Equity</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Account
                </label>
                <select name="parentId" className="input-field w-full">
                  <option value="">None</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea name="description" className="input-field w-full" rows={3} />
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
                  Create Account
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Edit Account Modal */}
      <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Edit Account
            </Dialog.Title>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedAccount) return;
                const formData = new FormData(e.currentTarget);
                updateAccountMutation.mutate({
                  id: selectedAccount.id,
                  data: {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                  },
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Code
                </label>
                <input
                  type="text"
                  value={selectedAccount?.code}
                  disabled
                  className="input-field w-full bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedAccount?.name}
                  required
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <input
                  type="text"
                  value={selectedAccount?.type}
                  disabled
                  className="input-field w-full bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={selectedAccount?.description}
                  className="input-field w-full"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default ChartOfAccounts; 