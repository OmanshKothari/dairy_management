/**
 * Source Controller
 * 
 * Handles management of stock sources (e.g., Farms, Markets).
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { ApiResponse } from '../types/index.js';

export const getAllSources = async (req: Request, res: Response): Promise<void> => {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { name: 'asc' }
    });
    
    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sources'
    });
  }
};

export const createSource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type } = req.body;
    
    if (!name || !type) {
        res.status(400).json({
            success: false,
            error: 'Name and type are required'
        });
        return;
    }

    const source = await prisma.source.create({
      data: {
        name,
        type,
        isActive: true
      }
    });

    res.json({
      success: true,
      data: source,
      message: 'Source created successfully'
    });
  } catch (error) {
    console.error('Error creating source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create source'
    });
  }
};

export const updateSource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, type, isActive } = req.body;

    const source = await prisma.source.update({
      where: { id },
      data: {
        name,
        type,
        isActive
      }
    });

    res.json({
      success: true,
      data: source,
      message: 'Source updated successfully'
    });
  } catch (error) {
    console.error('Error updating source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update source'
    });
  }
};

export const deleteSource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Hard delete or soft delete? 
    // Usually soft delete or check dependency. For now, simple delete.
    await prisma.source.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Source deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete source'
    });
  }
};
