export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  gstRate: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  totalAmount: number;
  gstAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
  createdById: string;
}

export interface CreateInvoiceDTO {
  customerId: string;
  customerName: string;
  customerGstin?: string;
  dueDate: string;
  items: Omit<InvoiceItem, 'id'>[];
}

export interface UpdateInvoiceDTO {
  status?: InvoiceStatus;
  dueDate?: string;
  items?: Omit<InvoiceItem, 'id'>[];
} 