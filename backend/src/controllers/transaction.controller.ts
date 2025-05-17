import { Request, Response } from 'express';
import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const {
      date,
      type,
      description,
      reference,
      amount,
      accountId,
      invoiceId,
      purchaseId,
      entries,
    } = req.body;

    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate entries (debits = credits)
    const totalDebits = entries.reduce((sum: number, entry: any) => sum + (entry.debit || 0), 0);
    const totalCredits = entries.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return res.status(400).json({
        error: 'Total debits must equal total credits',
      });
    }

    // Create transaction with journal entries
    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(date),
        type: type as TransactionType,
        description,
        reference,
        amount,
        accountId,
        invoiceId,
        purchaseId,
        createdById: userId,
        entries: {
          create: entries.map((entry: any) => ({
            accountId: entry.accountId,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
            description: entry.description,
          })),
        },
      },
      include: {
        entries: {
          include: {
            account: true,
          },
        },
        invoice: true,
        purchase: true,
      },
    });

    // Update account balances
    await Promise.all(
      entries.map((entry: any) =>
        prisma.account.update({
          where: { id: entry.accountId },
          data: {
            balance: {
              increment: (entry.debit || 0) - (entry.credit || 0),
            },
          },
        })
      )
    );

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { type, startDate, endDate, accountId, search } = req.query;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    if (accountId) {
      where.accountId = accountId;
    }

    if (search) {
      where.OR = [
        { description: { contains: search as string, mode: 'insensitive' } },
        { reference: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        entries: {
          include: {
            account: true,
          },
        },
        invoice: true,
        purchase: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            account: true,
          },
        },
        invoice: true,
        purchase: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        entries: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Reverse account balances
    await Promise.all(
      transaction.entries.map((entry) =>
        prisma.account.update({
          where: { id: entry.accountId },
          data: {
            balance: {
              decrement: entry.debit - entry.credit,
            },
          },
        })
      )
    );

    // Delete transaction (this will cascade delete journal entries)
    await prisma.transaction.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
}; 