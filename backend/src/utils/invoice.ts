import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateInvoiceNumber = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  // Get the count of invoices for the current month
  const invoiceCount = await prisma.invoice.count({
    where: {
      createdAt: {
        gte: new Date(date.getFullYear(), date.getMonth(), 1),
        lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
      },
    },
  });

  // Generate sequence number
  const sequence = (invoiceCount + 1).toString().padStart(4, '0');

  // Format: INV-YY-MM-SEQUENCE
  return `INV-${year}${month}-${sequence}`;
};

export const calculateInvoiceTotals = (items: Array<{
  quantity: number;
  unitPrice: number;
  gstRate: number;
}>) => {
  return items.reduce(
    (acc, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const gstAmount = (itemTotal * item.gstRate) / 100;
      return {
        totalAmount: acc.totalAmount + itemTotal,
        gstAmount: acc.gstAmount + gstAmount,
      };
    },
    { totalAmount: 0, gstAmount: 0 }
  );
};

export const isInvoiceEditable = (status: string): boolean => {
  const editableStatuses = ['DRAFT', 'PENDING'];
  return editableStatuses.includes(status);
};

export const shouldUpdateStock = (oldStatus: string, newStatus: string): boolean => {
  return oldStatus !== 'PAID' && newStatus === 'PAID';
}; 