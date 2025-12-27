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
  ApiResponse,
} from '../types/index.js';

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
    
    // Validate source from DB
    // We expect stockData.source to be the ID or Name of the Dynamic Source.
    // For backward compatibility or ease, let's assume UI sends the Source Name or ID.
    // Ideally, we link relation, but for now we store the string values as per schema.
    
    const source = await prisma.source.findUnique({
        where: { name: stockData.source as string } // Assuming source passed is the Name
    });

    if (!source) {
         // Fallback check if it's an ID
         const sourceById = await prisma.source.findUnique({
             where: { id: stockData.source as string }
         });
         
         if (!sourceById) {
            const response: ApiResponse<null> = {
                success: false,
                error: 'Invalid source. Please select a valid source.',
            };
            res.status(400).json(response);
            return;
         }
    }

    // Logic: If source found, use its name for storage to keep historical data intact?
    // Or we should store sourceID. The current schema `Stock` has `source` and `sourceName` as Strings.
    // Plan: `source` = ID/Key, `sourceName` = Human Readable.
    
    const sourceName = source ? source.name : await prisma.source.findUnique({
        where: { id: stockData.source as string }
    }).then(s => s?.name || 'Unknown');

    const newStock = await prisma.stock.create({
      data: {
        date: stockData.date,
        shift: stockData.shift,
        source: stockData.source as string, // Store key/ID
        sourceName: sourceName,
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
 * Get stock sources list (Dynamic)
 */
export const getStockSources = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Fetch active sources from DB
    const sources = await prisma.source.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    });
    
    const formattedSources = sources.map(source => ({
        value: source.name, // Using name as value for now to match old enum behavior if possible, or ID
        label: source.name,
        type: source.type
    }));
    
    const response: ApiResponse<typeof formattedSources> = {
      success: true,
      data: formattedSources,
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
