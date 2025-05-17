import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import DataTable from '@/components/DataTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Dialog } from '@headlessui/react';
import { clsx } from 'clsx';

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

interface ProductAnalytics {
  currentStock: number;
  reorderPoint: number;
  averageDailySales: number;
  daysUntilReorder: number;
  recommendations: string[];
}

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const queryClient = useQueryClient();

  // Fetch products
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products', searchTerm, selectedCategory, showLowStock],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (showLowStock) params.append('lowStock', 'true');

      const response = await fetch(`/api/inventory?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  // Fetch product analytics
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery<ProductAnalytics>({
    queryKey: ['product-analytics', selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct) throw new Error('No product selected');
      const response = await fetch(`/api/inventory/${selectedProduct.id}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: !!selectedProduct && showAnalytics,
  });

  // Create product mutation
  const createProduct = useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateModalOpen(false);
      toast.success('Product created successfully');
    },
    onError: () => {
      toast.error('Failed to create product');
    },
  });

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'sku', header: 'SKU', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    {
      key: 'unitPrice',
      header: 'Unit Price',
      sortable: true,
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      key: 'stockQuantity',
      header: 'Stock',
      sortable: true,
      render: (value: number, item: Product) => (
        <span
          className={clsx(
            'px-2 py-1 rounded-full text-xs font-medium',
            value <= item.reorderPoint
              ? 'bg-red-100 text-red-800'
              : value <= item.reorderPoint * 1.5
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          )}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'createdBy',
      header: 'Created By',
      render: (value: Product['createdBy']) =>
        `${value.firstName} ${value.lastName}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Inventory Management
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your products, track stock levels, and view analytics.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="input"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Clothing">Clothing</option>
          <option value="Food">Food</option>
          {/* Add more categories */}
        </select>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
            />
            <span className="text-sm text-gray-900">Show Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={products || []}
        columns={columns}
        isLoading={isLoading}
        onRowClick={(product) => {
          setSelectedProduct(product);
          setShowAnalytics(true);
        }}
      />

      {/* Analytics Modal */}
      <Dialog
        open={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-lg rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Product Analytics
            </Dialog.Title>

            {isLoadingAnalytics ? (
              <LoadingSpinner />
            ) : analytics ? (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="card p-4">
                    <div className="text-sm text-gray-500">Current Stock</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">
                      {analytics.currentStock}
                    </div>
                  </div>
                  <div className="card p-4">
                    <div className="text-sm text-gray-500">Avg. Daily Sales</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">
                      {analytics.averageDailySales.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="card p-4">
                  <div className="text-sm text-gray-500">Recommendations</div>
                  <ul className="mt-2 space-y-2">
                    {analytics.recommendations.map((rec, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <ChartBarIcon className="h-5 w-5 text-primary-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAnalytics(false)}
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Create Product Modal */}
      {/* Add form for creating new products */}
    </div>
  );
} 