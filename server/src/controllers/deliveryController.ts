/**
 * Delivery Controller
 * 
 * Handles all delivery-related operations including daily logs,
 * delivery tracking, and autofill functionality.
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import {
  Delivery,
  CreateDeliveryDTO,
  BulkDeliveryUpdateDTO,
  Shift,
  ApiResponse,
} from '../types/index.js';

/**
 * Get deliveries for a specific date and shift
 */
export const getDeliveriesByDateAndShift = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { date, shift } = req.query;
    
    if (!date || !shift) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Date and shift are required',
      };
      res.status(400).json(response);
      return;
    }
    
    // Get all active customers
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    
    // Get existing deliveries for the date and shift
    const existingDeliveries = await prisma.delivery.findMany({
      where: {
        date: date as string,
        shift: shift as string,
      },
    });
    
    const deliveryMap = new Map<string, any>();
    existingDeliveries.forEach((d) => {
      deliveryMap.set(d.customerId, d);
    });
    
    // Combine customers with their deliveries
    const deliveryData = customers.map((customer) => {
      const existingDelivery = deliveryMap.get(customer.id);
      const quota = shift === Shift.MORNING ? customer.morningQuota : customer.eveningQuota;

      if (existingDelivery) {
        return {
           ...existingDelivery,
           customerName: customer.name
        } as unknown as Delivery;
      }
      
      return {
        id: '',
        customerId: customer.id,
        customerName: customer.name,
        date: date as string,
        shift: shift as Shift,
        quota,
        actualAmount: 0,
        delivered: false,
        createdAt: null,
        updatedAt: null,
      } as unknown as Delivery;
    });
    
    const response: ApiResponse<typeof deliveryData> = {
      success: true,
      data: deliveryData,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch deliveries',
    };
    res.status(500).json(response);
  }
};

/**
 * Create or update a single delivery
 */
export const upsertDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deliveryData: CreateDeliveryDTO = req.body;
    
    // Get customer details for quota
    const customer = await prisma.customer.findUnique({
      where: { id: deliveryData.customerId },
    });
    
    if (!customer) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Customer not found',
      };
      res.status(404).json(response);
      return;
    }
    
    const quota = deliveryData.shift === Shift.MORNING 
      ? customer.morningQuota 
      : customer.eveningQuota;
    
    // Manual upsert
    let delivery = await prisma.delivery.findFirst({
        where: {
             customerId: deliveryData.customerId,
             date: deliveryData.date,
             shift: deliveryData.shift,
        }
    });

    if (delivery) {
        delivery = await prisma.delivery.update({
            where: { id: delivery.id },
            data: {
                actualAmount: deliveryData.actualAmount,
                delivered: deliveryData.delivered,
                notes: deliveryData.notes || '',
            }
        });
    } else {
        delivery = await prisma.delivery.create({
            data: {
                customerId: deliveryData.customerId,
                date: deliveryData.date,
                shift: deliveryData.shift,
                quota,
                actualAmount: deliveryData.actualAmount,
                delivered: deliveryData.delivered,
                notes: deliveryData.notes,
            }
        });
    }

    const responseData = {
        ...delivery,
        customerName: customer.name
    };
      
    const response: ApiResponse<Delivery> = {
      success: true,
      data: responseData as unknown as Delivery,
      message: 'Delivery updated successfully',
    };
    
    res.json(response);

  } catch (error) {
    console.error('Error upserting delivery:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to save delivery',
    };
    res.status(500).json(response);
  }
};

/**
 * Bulk update deliveries for a date and shift
 */
export const bulkUpdateDeliveries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bulkData: BulkDeliveryUpdateDTO = req.body;
    
    await prisma.$transaction(async (tx) => {
        for (const input of bulkData.deliveries) {
             const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
             if (!customer) continue;

             const quota = bulkData.shift === Shift.MORNING 
                ? customer.morningQuota 
                : customer.eveningQuota;

             const existing = await tx.delivery.findFirst({
                 where: {
                     customerId: input.customerId,
                     date: bulkData.date,
                     shift: bulkData.shift
                 }
             });

             if (existing) {
                 await tx.delivery.update({
                     where: { id: existing.id },
                     data: {
                        actualAmount: input.actualAmount,
                        delivered: input.delivered,
                        notes: input.notes || '',
                     }
                 });
             } else {
                 await tx.delivery.create({
                     data: {
                        customerId: input.customerId,
                        date: bulkData.date,
                        shift: bulkData.shift,
                        quota,
                        actualAmount: input.actualAmount,
                        delivered: input.delivered,
                        notes: input.notes,
                     }
                 });
             }
        }
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Deliveries updated successfully',
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error bulk updating deliveries:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to update deliveries',
    };
    res.status(500).json(response);
  }
};

/**
 * Autofill deliveries with customer quotas
 */
export const autofillDeliveries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { date, shift } = req.body;
    
    if (!date || !shift) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Date and shift are required',
      };
      res.status(400).json(response);
      return;
    }
    
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
    });
    
    let count = 0;
    
    await prisma.$transaction(async (tx) => {
        for (const customer of customers) {
            const quota = shift === Shift.MORNING ? customer.morningQuota : customer.eveningQuota;
            
            if (quota <= 0) continue;

            const existing = await tx.delivery.findFirst({
                where: {
                    customerId: customer.id,
                    date,
                    shift
                }
            });

            if (existing) {
                await tx.delivery.update({
                    where: { id: existing.id },
                    data: {
                        actualAmount: quota,
                        delivered: true,
                    }
                });
            } else {
                await tx.delivery.create({
                    data: {
                        customerId: customer.id,
                        date,
                        shift,
                        quota,
                        actualAmount: quota,
                        delivered: true,
                    }
                });
            }
            count++;
        }
    });
    
    const response: ApiResponse<{ count: number }> = {
      success: true,
      data: { count },
      message: `Autofilled ${count} deliveries`,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error autofilling deliveries:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to autofill deliveries',
    };
    res.status(500).json(response);
  }
};

/**
 * Clear all deliveries for a date and shift
 */
export const clearDeliveries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { date, shift } = req.body;
    
    if (!date || !shift) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Date and shift are required',
      };
      res.status(400).json(response);
      return;
    }
    
    await prisma.delivery.updateMany({
        where: {
            date,
            shift,
        },
        data: {
            actualAmount: 0,
            delivered: false,
        }
    });
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Deliveries cleared successfully',
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error clearing deliveries:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to clear deliveries',
    };
    res.status(500).json(response);
  }
};

/**
 * Get total deliveries for today
 */
export const getTodayTotal = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const aggregate = await prisma.delivery.aggregate({
        where: {
            date: today,
            delivered: true,
        },
        _sum: {
            actualAmount: true,
        }
    });
    
    const total = aggregate._sum.actualAmount || 0;
    
    const response: ApiResponse<{ total: number; date: string }> = {
      success: true,
      data: { total, date: today },
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching today total:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch today total',
    };
    res.status(500).json(response);
  }
};
