import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../../components/DataTable';
import LoadingSpinner from '../../components/LoadingSpinner';
import { format } from 'date-fns';
import { InvoiceStatus } from '../../types/invoice';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: invoices, isLoading, error } = useQuery<Invoice[]>({
    queryKey: ['invoices', searchTerm, statusFilter, startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      return api.get('/api/invoices', { params });
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error loading invoices</div>;

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice Number',
      accessor: 'invoiceNumber',
      sortable: true,
    },
    {
      key: 'customerName',
      header: 'Customer',
      accessor: 'customerName',
      sortable: true,
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      accessor: 'totalAmount',
      sortable: true,
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (value: InvoiceStatus) => (
        <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      accessor: 'dueDate',
      sortable: true,
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy'),
    },
    {
      key: 'createdBy',
      header: 'Created By',
      accessor: 'createdBy',
      render: (value: Invoice['createdBy']) => `${value.firstName} ${value.lastName}`,
    },
    {
      key: 'createdAt',
      header: 'Created At',
      accessor: 'createdAt',
      sortable: true,
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy'),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
        <button
          onClick={() => navigate('/billing/invoices/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create New Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'ALL')}
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable
          data={invoices || []}
          columns={columns}
          onRowClick={(row) => navigate(`/billing/invoices/${row.id}`)}
        />
      </div>

      {invoices && invoices.length > 0 && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Invoices</div>
              <div className="text-xl font-semibold">{invoices.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Amount</div>
              <div className="text-xl font-semibold">
                ₹{invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Pending Invoices</div>
              <div className="text-xl font-semibold">
                {invoices.filter(inv => inv.status === 'PENDING').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Overdue Invoices</div>
              <div className="text-xl font-semibold text-red-600">
                {invoices.filter(inv => inv.status === 'OVERDUE').length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getStatusColor = (status: InvoiceStatus): string => {
  const colors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return colors[status] || colors.DRAFT;
};

export default InvoiceList; 