import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  stockQuantity: number;
  reorderPoint: number;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['products', searchTerm, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`/api/inventory?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error loading inventory</div>;

  const columns = [
    {
      key: 'name',
      header: 'Name',
      accessor: 'name',
      sortable: true,
    },
    {
      key: 'sku',
      header: 'SKU',
      accessor: 'sku',
      sortable: true,
    },
    {
      key: 'category',
      header: 'Category',
      accessor: 'category',
      sortable: true,
    },
    {
      key: 'unitPrice',
      header: 'Unit Price',
      accessor: 'unitPrice',
      sortable: true,
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      key: 'stockQuantity',
      header: 'Stock',
      accessor: 'stockQuantity',
      sortable: true,
      render: (value: number, item?: Product) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            item && value <= item.reorderPoint
              ? 'bg-red-100 text-red-800'
              : item && value <= item.reorderPoint * 1.5
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'createdBy',
      header: 'Created By',
      accessor: 'createdBy',
      render: (value: Product['createdBy']) =>
        `${value.firstName} ${value.lastName}`,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your products and track stock levels
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
        <div>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <select
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Food">Food</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable
          data={products || []}
          columns={columns}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default Inventory; 