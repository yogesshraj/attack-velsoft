import { Request, Response } from 'express';
import { PrismaClient, AccountType } from '@prisma/client';

const prisma = new PrismaClient();

export const createAccount = async (req: Request, res: Response) => {
  try {
    const { code, name, type, description, parentId } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if account code already exists
    const existingAccount = await prisma.account.findUnique({
      where: { code },
    });

    if (existingAccount) {
      return res.status(400).json({ error: 'Account code already exists' });
    }

    // Create account
    const account = await prisma.account.create({
      data: {
        code,
        name,
        type: type as AccountType,
        description,
        parentId,
        createdById: userId,
      },
      include: {
        parentAccount: true,
        subAccounts: true,
      },
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

export const getAccounts = async (req: Request, res: Response) => {
  try {
    const { type, search, parentId } = req.query;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { code: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (parentId) {
      where.parentId = parentId;
    }

    const accounts = await prisma.account.findMany({
      where,
      include: {
        parentAccount: true,
        subAccounts: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: [
        { code: 'asc' },
      ],
    });

    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

export const getAccountById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;

    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        parentAccount: true,
        subAccounts: true,
        transactions: {
          include: {
            entries: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const account = await prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Only allow updating name and description
    const updatedAccount = await prisma.account.update({
      where: { id },
      data: {
        name,
        description,
      },
      include: {
        parentAccount: true,
        subAccounts: true,
      },
    });

    res.json(updatedAccount);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        subAccounts: true,
        transactions: true,
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check if account has sub-accounts
    if (account.subAccounts.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete account with sub-accounts',
      });
    }

    // Check if account has transactions
    if (account.transactions.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete account with transactions',
      });
    }

    await prisma.account.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

export const getAccountBalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const userId = (req.user as any)?.id;

    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        journalEntries: {
          where: {
            transaction: {
              date: {
                gte: startDate ? new Date(startDate as string) : undefined,
                lte: endDate ? new Date(endDate as string) : undefined,
              },
            },
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const balance = account.journalEntries.reduce((acc, entry) => {
      return acc + entry.debit - entry.credit;
    }, 0);

    res.json({
      accountId: id,
      balance,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('Error calculating account balance:', error);
    res.status(500).json({ error: 'Failed to calculate account balance' });
  }
}; 