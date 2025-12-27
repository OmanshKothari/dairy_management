/**
 * Settings Controller
 * 
 * Handles application settings including business information,
 * default pricing, and configuration options.
 */

import { Request, Response } from 'express';
import { db, COLLECTIONS } from '../config/firebase.js';
import { Settings, ApiResponse } from '../types/index.js';

const settingsCollection = db.collection(COLLECTIONS.SETTINGS);

/**
 * Default settings configuration
 */
const DEFAULT_SETTINGS: Settings = {
  businessName: 'MilkyWay Dairy Services',
  businessAddress: '123 Farm Lane, Countryside',
  businessPhone: '+1 234 567 890',
  defaultPricePerLiter: 2.0,
  currency: 'USD',
  currencySymbol: '$',
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
    const doc = await settingsCollection.doc('default').get();
    
    let settings: Settings;
    
    if (!doc.exists) {
      // Create default settings if not exists
      await settingsCollection.doc('default').set(DEFAULT_SETTINGS);
      settings = DEFAULT_SETTINGS;
    } else {
      settings = doc.data() as Settings;
    }
    
    const response: ApiResponse<Settings> = {
      success: true,
      data: settings,
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
    
    const docRef = settingsCollection.doc('default');
    const doc = await docRef.get();
    
    if (!doc.exists) {
      // Create with merged defaults and update data
      const newSettings = { ...DEFAULT_SETTINGS, ...updateData };
      await docRef.set(newSettings);
      
      const response: ApiResponse<Settings> = {
        success: true,
        data: newSettings,
        message: 'Settings created successfully',
      };
      
      res.status(201).json(response);
    } else {
      // Update existing settings
      await docRef.update(updateData);
      
      const updatedDoc = await docRef.get();
      const settings = updatedDoc.data() as Settings;
      
      const response: ApiResponse<Settings> = {
        success: true,
        data: settings,
        message: 'Settings updated successfully',
      };
      
      res.json(response);
    }
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
    await settingsCollection.doc('default').set(DEFAULT_SETTINGS);
    
    const response: ApiResponse<Settings> = {
      success: true,
      data: DEFAULT_SETTINGS,
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
