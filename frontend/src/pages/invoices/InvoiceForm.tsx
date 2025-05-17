import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, FieldArray } from 'formik';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Yup from 'yup';
import { format } from 'date-fns';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Invoice, InvoiceItem, CreateInvoiceDTO } from '../../types/invoice';

interface Product {
  id: string;
  name: string;
  unitPrice: number;
  stockQuantity: number;
}

const InvoiceForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/invoices/${id}`);
      if (!response.ok) throw new Error('Failed to fetch invoice');
      return response.json();
    },
    enabled: !!id,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: CreateInvoiceDTO) => {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create invoice');
      return response.json();
    },
    onSuccess: () => {
      navigate('/invoices');
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const initialValues: CreateInvoiceDTO = {
    customerId: invoice?.customerId || '',
    customerName: invoice?.customerName || '',
    customerGstin: invoice?.customerGstin || '',
    dueDate: invoice?.dueDate || format(new Date(), 'yyyy-MM-dd'),
    items: invoice?.items || [],
  };

  const validationSchema = Yup.object({
    customerName: Yup.string().required('Required'),
    customerId: Yup.string().required('Required'),
    dueDate: Yup.date().required('Required'),
    items: Yup.array().of(
      Yup.object({
        quantity: Yup.number().min(1, 'Must be at least 1').required('Required'),
        unitPrice: Yup.number().min(0, 'Must be positive').required('Required'),
        gstRate: Yup.number().min(0, 'Must be positive').required('Required'),
      })
    ),
  });

  const calculateTotals = (items: InvoiceItem[]) => {
    return items.reduce(
      (acc, item) => {
        const itemTotal = item.quantity * item.unitPrice;
        const gstAmount = (itemTotal * item.gstRate) / 100;
        return {
          totalAmount: acc.totalAmount + itemTotal + gstAmount,
          gstAmount: acc.gstAmount + gstAmount,
        };
      },
      { totalAmount: 0, gstAmount: 0 }
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {id ? 'Edit Invoice' : 'Create New Invoice'}
      </h1>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          await createInvoiceMutation.mutateAsync(values);
        }}
      >
        {({ values, errors, touched, setFieldValue }) => (
          <Form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer Name
                </label>
                <Field
                  name="customerName"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.customerName && touched.customerName && (
                  <div className="text-red-500 text-sm mt-1">{errors.customerName}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer ID
                </label>
                <Field
                  name="customerId"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.customerId && touched.customerId && (
                  <div className="text-red-500 text-sm mt-1">{errors.customerId}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  GSTIN
                </label>
                <Field
                  name="customerGstin"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Due Date
                </label>
                <Field
                  type="date"
                  name="dueDate"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.dueDate && touched.dueDate && (
                  <div className="text-red-500 text-sm mt-1">{errors.dueDate}</div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Items</h2>
              
              <div className="flex gap-4 mb-4">
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const product = products?.find(p => p.id === e.target.value);
                    setSelectedProduct(product || null);
                  }}
                >
                  <option value="">Select a product</option>
                  {products?.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (₹{product.unitPrice})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => {
                    if (selectedProduct) {
                      const newItem: Omit<InvoiceItem, 'id'> = {
                        productId: selectedProduct.id,
                        productName: selectedProduct.name,
                        quantity: 1,
                        unitPrice: selectedProduct.unitPrice,
                        totalPrice: selectedProduct.unitPrice,
                        gstRate: 18, // Default GST rate
                      };
                      setFieldValue('items', [...values.items, newItem]);
                      setSelectedProduct(null);
                    }
                  }}
                >
                  Add Item
                </button>
              </div>

              <FieldArray name="items">
                {({ remove }) => (
                  <div className="space-y-4">
                    {values.items.map((item, index) => (
                      <div key={index} className="flex gap-4 items-center">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.productName}</div>
                          <div className="text-sm text-gray-500">₹{item.unitPrice}</div>
                        </div>

                        <Field
                          name={`items.${index}.quantity`}
                          type="number"
                          className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />

                        <Field
                          name={`items.${index}.gstRate`}
                          type="number"
                          className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />

                        <div className="text-right w-32">
                          ₹{(item.quantity * item.unitPrice).toFixed(2)}
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </FieldArray>

              {values.items.length > 0 && (
                <div className="mt-6 text-right">
                  <div className="text-sm text-gray-500">
                    Subtotal: ₹{calculateTotals(values.items).totalAmount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    GST: ₹{calculateTotals(values.items).gstAmount.toFixed(2)}
                  </div>
                  <div className="text-lg font-medium">
                    Total: ₹{(
                      calculateTotals(values.items).totalAmount +
                      calculateTotals(values.items).gstAmount
                    ).toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={() => navigate('/invoices')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={createInvoiceMutation.isLoading}
              >
                {createInvoiceMutation.isLoading ? 'Saving...' : 'Save Invoice'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default InvoiceForm; 