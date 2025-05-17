import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { BlobServiceClient } from '@azure/storage-blob';
import { TextAnalyticsClient } from '@azure/ai-text-analytics';
import { AzureKeyCredential } from '@azure/core-auth';

const prisma = new PrismaClient();

// Azure AI Text Analytics client
const textAnalyticsClient = new TextAnalyticsClient(
  process.env.AZURE_AI_ENDPOINT || '',
  new AzureKeyCredential(process.env.AZURE_AI_KEY || '')
);

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
    const productData = productSchema.parse(req.body);
    
    // Use Azure AI to analyze product description for categorization
    if (productData.description) {
      const [result] = await textAnalyticsClient.extractKeyPhrases([
        productData.description,
      ]);
      
      if (result.keyPhrases.length > 0) {
        // Store key phrases for better search and categorization
        productData.description = `${productData.description}\nKey features: ${result.keyPhrases.join(', ')}`;
      }
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        createdById: (req.user as any).id,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, category, lowStock } = req.query;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    if (category) {
      where.category = category;
    }
    
    if (lowStock === 'true') {
      where.stockQuantity = {
        lte: prisma.product.fields.reorderPoint,
      };
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
        updatedAt: 'desc',
      },
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
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
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productData = productSchema.partial().parse(req.body);

    // Use Azure AI to analyze updated product description
    if (productData.description) {
      const [result] = await textAnalyticsClient.extractKeyPhrases([
        productData.description,
      ]);
      
      if (result.keyPhrases.length > 0) {
        productData.description = `${productData.description}\nKey features: ${result.keyPhrases.join(', ')}`;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: productData,
    });

    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
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
    res.status(500).json({ error: 'Internal server error' });
  }
};

// AI-powered inventory predictions
export const getPredictiveAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get historical data
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        invoiceItems: {
          select: {
            quantity: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate average daily sales
    const salesData = product.invoiceItems.reduce((acc: any, item) => {
      const date = item.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + item.quantity;
      return acc;
    }, {});

    const dailySales = Object.values(salesData);
    const avgDailySales = dailySales.length > 0
      ? dailySales.reduce((a: any, b: any) => a + b, 0) / dailySales.length
      : 0;

    // Calculate days until reorder needed
    const daysUntilReorder = product.stockQuantity > product.reorderPoint
      ? Math.floor((product.stockQuantity - product.reorderPoint) / avgDailySales)
      : 0;

    // Generate recommendations
    const recommendations = [];
    if (daysUntilReorder <= 7) {
      recommendations.push('Order soon: Stock will reach reorder point within a week');
    }
    if (product.stockQuantity <= product.reorderPoint) {
      recommendations.push('Critical: Stock is at or below reorder point');
    }
    if (avgDailySales === 0) {
      recommendations.push('Warning: No recent sales data available');
    }

    res.json({
      currentStock: product.stockQuantity,
      reorderPoint: product.reorderPoint,
      averageDailySales: avgDailySales,
      daysUntilReorder,
      recommendations,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}; 