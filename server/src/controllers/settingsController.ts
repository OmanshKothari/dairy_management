/**
 * Settings Controller
 * 
 * Handles application settings including business information,
 * default pricing, and configuration options.
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { Settings, ApiResponse } from '../types/index.js';

/**
 * Default settings configuration
 */
const DEFAULT_SETTINGS: Omit<Settings, 'id'> = {
  businessName: 'MilkyWay Dairy Services',
  businessAddress: '123 Farm Lane, Countryside',
  businessPhone: '+91 234 567 890',
  defaultPricePerLiter: 2.0,
  currency: 'INR',
  currencySymbol: '₹',
  maxCapacity: 2000,
  paymentTerms: 5,
};

/**
 * Get application settings
 */
export const getSettings = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 1 },
    });
    
    if (!settings) {
      // Create default settings if not exists
      settings = await prisma.settings.create({
        data: DEFAULT_SETTINGS,
      });
    }
    
    const response: ApiResponse<Settings> = {
      success: true,
      data: settings as unknown as Settings,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching settings:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch settings',
    };
    res.status(500).json(response);
  }
};

/**
 * Update application settings
 */
export const updateSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const updateData: Partial<Settings> = req.body;
    
    // Remove id from update data if present to avoid errors
    const { id, ...dataToUpdate } = updateData as any;

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: dataToUpdate,
      create: {
        ...DEFAULT_SETTINGS,
        ...dataToUpdate,
      },
    });
      
    const response: ApiResponse<Settings> = {
    success: true,
    data: settings as unknown as Settings,
    message: 'Settings updated successfully',
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error updating settings:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to update settings',
    };
    res.status(500).json(response);
  }
};

/**
 * Reset settings to defaults
 */
export const resetSettings = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: DEFAULT_SETTINGS,
      create: DEFAULT_SETTINGS,
    });
    
    const response: ApiResponse<Settings> = {
      success: true,
      data: settings as unknown as Settings,
      message: 'Settings reset to defaults',
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error resetting settings:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to reset settings',
    };
    res.status(500).json(response);
  }
};
