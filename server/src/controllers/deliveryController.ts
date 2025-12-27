/**
 * Delivery Controller
 * 
 * Handles all delivery-related operations including daily logs,
 * delivery tracking, and autofill functionality.
 */

import { Request, Response } from 'express';
import { db, COLLECTIONS } from '../config/firebase.js';
import {
  Delivery,
  CreateDeliveryDTO,
  BulkDeliveryUpdateDTO,
  Shift,
  ApiResponse,
  Customer,
} from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const deliveriesCollection = db.collection(COLLECTIONS.DELIVERIES);
const customersCollection = db.collection(COLLECTIONS.CUSTOMERS);

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
    const customersSnapshot = await customersCollection
      .where('isActive', '==', true)
      .orderBy('name')
      .get();
    
    const customers: Customer[] = customersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Customer[];
    
    // Get existing deliveries for the date and shift
    const deliveriesSnapshot = await deliveriesCollection
      .where('date', '==', date)
      .where('shift', '==', shift)
      .get();
    
    const existingDeliveries = new Map<string, Delivery>();
    deliveriesSnapshot.docs.forEach((doc) => {
      const delivery = { id: doc.id, ...doc.data() } as Delivery;
      existingDeliveries.set(delivery.customerId, delivery);
    });
    
    // Combine customers with their deliveries
    const deliveryData = customers.map((customer) => {
      const existingDelivery = existingDeliveries.get(customer.id);
      const quota = shift === Shift.MORNING ? customer.morningQuota : customer.eveningQuota;
      
      return existingDelivery || {
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
      };
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
    
    // Get customer details
    const customerDoc = await customersCollection.doc(deliveryData.customerId).get();
    
    if (!customerDoc.exists) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Customer not found',
      };
      res.status(404).json(response);
      return;
    }
    
    const customer = customerDoc.data() as Customer;
    const quota = deliveryData.shift === Shift.MORNING 
      ? customer.morningQuota 
      : customer.eveningQuota;
    
    // Check if delivery already exists
    const existingSnapshot = await deliveriesCollection
      .where('customerId', '==', deliveryData.customerId)
      .where('date', '==', deliveryData.date)
      .where('shift', '==', deliveryData.shift)
      .limit(1)
      .get();
    
    const now = new Date();
    
    if (!existingSnapshot.empty) {
      // Update existing delivery
      const docRef = existingSnapshot.docs[0].ref;
      await docRef.update({
        actualAmount: deliveryData.actualAmount,
        delivered: deliveryData.delivered,
        notes: deliveryData.notes || '',
        updatedAt: now,
      });
      
      const updatedDoc = await docRef.get();
      const delivery: Delivery = {
        id: updatedDoc.id,
        ...updatedDoc.data(),
        createdAt: updatedDoc.data()?.createdAt?.toDate(),
        updatedAt: updatedDoc.data()?.updatedAt?.toDate(),
      } as Delivery;
      
      const response: ApiResponse<Delivery> = {
        success: true,
        data: delivery,
        message: 'Delivery updated successfully',
      };
      
      res.json(response);
    } else {
      // Create new delivery
      const id = uuidv4();
      
      const newDelivery: Delivery = {
        id,
        customerId: deliveryData.customerId,
        customerName: customer.name,
        date: deliveryData.date,
        shift: deliveryData.shift,
        quota,
        actualAmount: deliveryData.actualAmount,
        delivered: deliveryData.delivered,
        notes: deliveryData.notes,
        createdAt: now,
        updatedAt: now,
      };
      
      await deliveriesCollection.doc(id).set({
        ...newDelivery,
        createdAt: now,
        updatedAt: now,
      });
      
      const response: ApiResponse<Delivery> = {
        success: true,
        data: newDelivery,
        message: 'Delivery created successfully',
      };
      
      res.status(201).json(response);
    }
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
    const batch = db.batch();
    const now = new Date();
    
    for (const delivery of bulkData.deliveries) {
      // Get customer details
      const customerDoc = await customersCollection.doc(delivery.customerId).get();
      
      if (!customerDoc.exists) {
        continue;
      }
      
      const customer = customerDoc.data() as Customer;
      const quota = bulkData.shift === Shift.MORNING 
        ? customer.morningQuota 
        : customer.eveningQuota;
      
      // Check for existing delivery
      const existingSnapshot = await deliveriesCollection
        .where('customerId', '==', delivery.customerId)
        .where('date', '==', bulkData.date)
        .where('shift', '==', bulkData.shift)
        .limit(1)
        .get();
      
      if (!existingSnapshot.empty) {
        // Update existing
        batch.update(existingSnapshot.docs[0].ref, {
          actualAmount: delivery.actualAmount,
          delivered: delivery.delivered,
          notes: delivery.notes || '',
          updatedAt: now,
        });
      } else {
        // Create new
        const id = uuidv4();
        const docRef = deliveriesCollection.doc(id);
        
        batch.set(docRef, {
          id,
          customerId: delivery.customerId,
          customerName: customer.name,
          date: bulkData.date,
          shift: bulkData.shift,
          quota,
          actualAmount: delivery.actualAmount,
          delivered: delivery.delivered,
          notes: delivery.notes || '',
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    
    await batch.commit();
    
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
    
    // Get all active customers
    const customersSnapshot = await customersCollection
      .where('isActive', '==', true)
      .get();
    
    const batch = db.batch();
    const now = new Date();
    const createdDeliveries: Delivery[] = [];
    
    for (const customerDoc of customersSnapshot.docs) {
      const customer = { id: customerDoc.id, ...customerDoc.data() } as Customer;
      const quota = shift === Shift.MORNING ? customer.morningQuota : customer.eveningQuota;
      
      // Skip if quota is 0
      if (quota <= 0) {
        continue;
      }
      
      // Check for existing delivery
      const existingSnapshot = await deliveriesCollection
        .where('customerId', '==', customer.id)
        .where('date', '==', date)
        .where('shift', '==', shift)
        .limit(1)
        .get();
      
      if (existingSnapshot.empty) {
        // Create new delivery with quota as actual amount
        const id = uuidv4();
        const docRef = deliveriesCollection.doc(id);
        
        const newDelivery: Delivery = {
          id,
          customerId: customer.id,
          customerName: customer.name,
          date,
          shift,
          quota,
          actualAmount: quota,
          delivered: true,
          createdAt: now,
          updatedAt: now,
        };
        
        batch.set(docRef, {
          ...newDelivery,
          createdAt: now,
          updatedAt: now,
        });
        
        createdDeliveries.push(newDelivery);
      } else {
        // Update existing delivery to delivered with quota
        batch.update(existingSnapshot.docs[0].ref, {
          actualAmount: quota,
          delivered: true,
          updatedAt: now,
        });
      }
    }
    
    await batch.commit();
    
    const response: ApiResponse<{ count: number }> = {
      success: true,
      data: { count: createdDeliveries.length },
      message: `Autofilled ${createdDeliveries.length} deliveries`,
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
    
    const snapshot = await deliveriesCollection
      .where('date', '==', date)
      .where('shift', '==', shift)
      .get();
    
    const batch = db.batch();
    const now = new Date();
    
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        actualAmount: 0,
        delivered: false,
        updatedAt: now,
      });
    });
    
    await batch.commit();
    
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
    
    const snapshot = await deliveriesCollection
      .where('date', '==', today)
      .where('delivered', '==', true)
      .get();
    
    let total = 0;
    snapshot.docs.forEach((doc) => {
      total += doc.data().actualAmount || 0;
    });
    
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
