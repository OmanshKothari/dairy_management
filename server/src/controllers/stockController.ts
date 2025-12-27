/**
 * Stock Controller
 * 
 * Handles all stock-related operations including recording collections,
 * tracking inventory levels, and managing stock sources.
 */

import { Request, Response } from 'express';
import { db, COLLECTIONS } from '../config/firebase.js';
import {
  Stock,
  CreateStockDTO,
  StockSource,
  ApiResponse,
} from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const stockCollection = db.collection(COLLECTIONS.STOCK);
const deliveriesCollection = db.collection(COLLECTIONS.DELIVERIES);
const settingsCollection = db.collection(COLLECTIONS.SETTINGS);

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
    
    let query: FirebaseFirestore.Query = stockCollection
      .orderBy('date', 'desc')
      .orderBy('createdAt', 'desc');
    
    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }
    
    query = query.limit(parseInt(limit as string, 10));
    
    const snapshot = await query.get();
    
    const stockRecords: Stock[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Stock[];
    
    const response: ApiResponse<Stock[]> = {
      success: true,
      data: stockRecords,
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
    
    const snapshot = await stockCollection
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string, 10))
      .get();
    
    const stockRecords: Stock[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Stock[];
    
    const response: ApiResponse<Stock[]> = {
      success: true,
      data: stockRecords,
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
    
    const id = uuidv4();
    const now = new Date();
    
    const newStock: Stock = {
      id,
      date: stockData.date,
      shift: stockData.shift,
      source: stockData.source,
      sourceName: SOURCE_NAMES[stockData.source],
      quantity: stockData.quantity,
      createdAt: now,
    };
    
    await stockCollection.doc(id).set({
      ...newStock,
      createdAt: now,
    });
    
    const response: ApiResponse<Stock> = {
      success: true,
      data: newStock,
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
    
    const docRef = stockCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Stock record not found',
      };
      res.status(404).json(response);
      return;
    }
    
    await docRef.delete();
    
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
    // Get all stock records (total in)
    const stockSnapshot = await stockCollection.get();
    let totalStockIn = 0;
    stockSnapshot.docs.forEach((doc) => {
      totalStockIn += doc.data().quantity || 0;
    });
    
    // Get all delivered deliveries (total out)
    const deliveriesSnapshot = await deliveriesCollection
      .where('delivered', '==', true)
      .get();
    let totalDelivered = 0;
    deliveriesSnapshot.docs.forEach((doc) => {
      totalDelivered += doc.data().actualAmount || 0;
    });
    
    // Calculate current inventory
    const currentInventory = totalStockIn - totalDelivered;
    
    // Get max capacity from settings
    const settingsDoc = await settingsCollection.doc('default').get();
    const maxCapacity = settingsDoc.exists 
      ? settingsDoc.data()?.maxCapacity || 2000 
      : 2000;
    
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
