import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  sku: z.string().min(3),
  category: z.string(),
  unitPrice: z.number().positive(),
  stockQuantity: z.number().int().min(0),
  reorderPoint: z.number().int().min(0),
});

// CRUD Operations
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, sku, category, unitPrice, stockQuantity, reorderPoint } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category,
        unitPrice: parseFloat(unitPrice),
        stockQuantity: parseInt(stockQuantity),
        reorderPoint: parseInt(reorderPoint),
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, category } = req.query;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { sku: { contains: search as string } },
      ];
    }
    
    if (category) {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sku, category, unitPrice, stockQuantity, reorderPoint } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        category,
        unitPrice: parseFloat(unitPrice),
        stockQuantity: parseInt(stockQuantity),
        reorderPoint: parseInt(reorderPoint),
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
}; 