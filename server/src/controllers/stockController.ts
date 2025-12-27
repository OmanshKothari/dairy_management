/**
 * Stock Controller
 * 
 * Handles all stock-related operations including recording collections,
 * tracking inventory levels, and managing stock sources.
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import {
  Stock,
  CreateStockDTO,
  StockSource,
  ApiResponse,
} from '../types/index.js';

/**
 * Source name mapping
 */
const SOURCE_NAMES: Record<StockSource, string> = {
  [StockSource.FARM_A]: 'Farm A',
  [StockSource.FARM_B]: 'Farm B',
  [StockSource.MARKET]: 'Market',
  [StockSource.OTHER]: 'Other',
};

/**
 * Get all stock records with optional date filtering
 */
export const getAllStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate, limit = '50' } = req.query;
    
    const where: any = {};
    
    if (startDate) {
      where.date = { gte: startDate as string };
    }
    
    if (endDate) {
      where.date = { ...where.date, lte: endDate as string }; // Merge with existing date filter if any
    }
    
    const stockRecords = await prisma.stock.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
      take: parseInt(limit as string, 10),
    });
    
    const response: ApiResponse<Stock[]> = {
      success: true,
      data: stockRecords as unknown as Stock[],
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching stock records:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch stock records',
    };
    res.status(500).json(response);
  }
};

/**
 * Get recent stock collections
 */
export const getRecentCollections = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { limit = '10' } = req.query;
    
    const stockRecords = await prisma.stock.findMany({
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
    });
    
    const response: ApiResponse<Stock[]> = {
      success: true,
      data: stockRecords as unknown as Stock[],
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching recent collections:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch recent collections',
    };
    res.status(500).json(response);
  }
};

/**
 * Record a new stock collection
 */
export const createStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const stockData: CreateStockDTO = req.body;
    
    const newStock = await prisma.stock.create({
      data: {
        date: stockData.date,
        shift: stockData.shift,
        source: stockData.source,
        sourceName: SOURCE_NAMES[stockData.source],
        quantity: stockData.quantity,
      },
    });
    
    const response: ApiResponse<Stock> = {
      success: true,
      data: newStock as unknown as Stock,
      message: 'Stock record created successfully',
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating stock record:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to create stock record',
    };
    res.status(500).json(response);
  }
};

/**
 * Delete a stock record
 */
export const deleteStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.stock.findUnique({ where: { id } });
    if (!existing) {
       const response: ApiResponse<null> = {
        success: false,
        error: 'Stock record not found',
      };
      res.status(404).json(response);
      return;
    }

    await prisma.stock.delete({ where: { id } });
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Stock record deleted successfully',
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error deleting stock record:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to delete stock record',
    };
    res.status(500).json(response);
  }
};

/**
 * Calculate current inventory level
 * Current Inventory = Total Stock In - Total Deliveries
 */
export const getCurrentInventory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Total Stock In
    const stockAgg = await prisma.stock.aggregate({
        _sum: { quantity: true }
    });
    const totalStockIn = stockAgg._sum.quantity || 0;
    
    // Total Delivered
    const deliveryAgg = await prisma.delivery.aggregate({
        where: { delivered: true },
        _sum: { actualAmount: true }
    });
    const totalDelivered = deliveryAgg._sum.actualAmount || 0;
    
    // Calculate current inventory
    const currentInventory = totalStockIn - totalDelivered;
    
    // Get max capacity from settings
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const maxCapacity = settings?.maxCapacity || 2000;
    
    const percentage = Math.min((currentInventory / maxCapacity) * 100, 100);
    
    const response: ApiResponse<{
      currentInventory: number;
      maxCapacity: number;
      percentage: number;
      lowStock: boolean;
    }> = {
      success: true,
      data: {
        currentInventory: Math.max(0, currentInventory),
        maxCapacity,
        percentage: Math.max(0, percentage),
        lowStock: percentage < 20,
      },
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error calculating inventory:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to calculate inventory',
    };
    res.status(500).json(response);
  }
};

/**
 * Get stock sources list
 */
export const getStockSources = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const sources = Object.entries(SOURCE_NAMES).map(([value, label]) => ({
      value,
      label,
    }));
    
    const response: ApiResponse<typeof sources> = {
      success: true,
      data: sources,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching stock sources:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch stock sources',
    };
    res.status(500).json(response);
  }
};
