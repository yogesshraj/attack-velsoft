import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Invoice, InvoiceStatus } from '../../types/invoice';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Add PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontSize: 12,
  },
  value: {
    flex: 1,
    fontSize: 12,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  col1: { width: '40%' },
  col2: { width: '15%' },
  col3: { width: '15%' },
  col4: { width: '15%' },
  col5: { width: '15%' },
  total: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
});

// PDF Document Component
const InvoicePDF = ({ invoice }: { invoice: Invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Invoice {invoice.invoiceNumber}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoice Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{invoice.status}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Due Date:</Text>
          <Text style={styles.value}>
            {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{invoice.customerName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>GSTIN:</Text>
          <Text style={styles.value}>{invoice.customerGstin || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Product</Text>
          <Text style={styles.col2}>Quantity</Text>
          <Text style={styles.col3}>Unit Price</Text>
          <Text style={styles.col4}>GST Rate</Text>
          <Text style={styles.col5}>Total</Text>
        </View>
        {invoice.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.col1}>{item.productName}</Text>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col3}>₹{item.unitPrice.toFixed(2)}</Text>
            <Text style={styles.col4}>{item.gstRate}%</Text>
            <Text style={styles.col5}>
              ₹{(item.quantity * item.unitPrice).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.total}>
        <View style={styles.row}>
          <Text style={styles.label}>Subtotal:</Text>
          <Text style={styles.value}>₹{invoice.totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>GST:</Text>
          <Text style={styles.value}>₹{invoice.gstAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total:</Text>
          <Text style={styles.value}>
            ₹{(invoice.totalAmount + invoice.gstAmount).toFixed(2)}
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${id}`);
      if (!response.ok) throw new Error('Failed to fetch invoice');
      return response.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: InvoiceStatus) => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update invoice status');
      return response.json();
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!invoice) return <div>Invoice not found</div>;

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Invoice Details</h1>
        <div className="flex gap-4">
          <PDFDownloadLink
            document={<InvoicePDF invoice={invoice} />}
            fileName={`invoice-${invoice.invoiceNumber}.pdf`}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {({ loading }) =>
              loading ? 'Preparing Download...' : 'Download PDF'
            }
          </PDFDownloadLink>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Print
          </button>
          <button
            onClick={() => navigate(`/billing/invoices/${id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit Invoice
          </button>
          <button
            onClick={() => navigate('/billing/invoices')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Invoice Information</h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Invoice Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{invoice.invoiceNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-sm rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900">Customer Information</h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{invoice.customerName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Customer ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{invoice.customerId}</dd>
                </div>
                {invoice.customerGstin && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">GSTIN</dt>
                    <dd className="mt-1 text-sm text-gray-900">{invoice.customerGstin}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Items</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GST Rate
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ₹{item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {item.gstRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ₹{(item.quantity * item.unitPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                  Subtotal
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                  ₹{invoice.totalAmount.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                  GST
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                  ₹{invoice.gstAmount.toFixed(2)}
                </td>
              </tr>
              <tr className="font-bold">
                <td colSpan={4} className="px-6 py-4 text-sm text-gray-900 text-right">
                  Total
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                  ₹{(invoice.totalAmount + invoice.gstAmount).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="p-6 bg-gray-50 border-t">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Update Status</h2>
          <div className="flex gap-4">
            {Object.values(InvoiceStatus).map((status) => (
              <button
                key={status}
                onClick={() => updateStatusMutation.mutate(status)}
                disabled={invoice.status === status || updateStatusMutation.isLoading}
                className={`px-4 py-2 rounded-lg ${
                  invoice.status === status
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Mark as {status}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail; 