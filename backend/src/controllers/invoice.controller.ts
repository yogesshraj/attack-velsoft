import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateInvoiceNumber } from '../utils/invoice';

const prisma = new PrismaClient();

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { customerId, customerName, customerGstin, dueDate, items } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Calculate totals
    const itemsWithTotals = items.map((item: any) => {
      const totalPrice = item.quantity * item.unitPrice;
      const gstAmount = (totalPrice * item.gstRate) / 100;
      return {
        ...item,
        totalPrice: totalPrice + gstAmount,
      };
    });

    const totalAmount = itemsWithTotals.reduce((acc: number, item: any) => acc + item.totalPrice, 0);
    const gstAmount = itemsWithTotals.reduce(
      (acc: number, item: any) => acc + (item.totalPrice * item.gstRate) / 100,
      0
    );

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: await generateInvoiceNumber(),
        customerId,
        customerName,
        customerGstin,
        totalAmount,
        gstAmount,
        status: 'DRAFT',
        dueDate: new Date(dueDate),
        createdById: userId,
        items: {
          create: itemsWithTotals.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            gstRate: item.gstRate,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { search, status, startDate, endDate, customerId } = req.query;
    
    const where: any = {};
    
    // Search filter
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search as string, mode: 'insensitive' } },
        { customerName: { contains: search as string, mode: 'insensitive' } },
        { customerGstin: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    // Status filter
    if (status) {
      where.status = status;
    }
    
    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }
    
    // Customer filter
    if (customerId) {
      where.customerId = customerId;
    }

    // Check for overdue invoices and update their status
    await prisma.invoice.updateMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: new Date(),
        },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the response to include product names
    const transformedInvoices = invoices.map(invoice => ({
      ...invoice,
      items: invoice.items.map(item => ({
        ...item,
        productName: item.product.name,
        product: undefined,
      })),
    }));

    res.json(transformedInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Transform the response to include product names
    const transformedInvoice = {
      ...invoice,
      items: invoice.items.map((item) => ({
        ...item,
        productName: item.product.name,
        product: undefined,
      })),
    };

    res.json(transformedInvoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, dueDate, items } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // If status is being updated to PAID, check if all items are in stock
    if (status === 'PAID') {
      const invoiceItems = await prisma.invoiceItem.findMany({
        where: { invoiceId: id },
        include: { product: true },
      });

      for (const item of invoiceItems) {
        if (item.product.stockQuantity < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for product ${item.product.name}`,
          });
        }
      }

      // Update stock quantities
      await Promise.all(
        invoiceItems.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          })
        )
      );
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: status || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        items: items
          ? {
              deleteMany: {},
              create: items.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                gstRate: item.gstRate,
              })),
            }
          : undefined,
      },
      include: {
        items: true,
      },
    });

    res.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({
        error: 'Cannot delete a paid invoice',
      });
    }

    await prisma.invoice.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
}; 