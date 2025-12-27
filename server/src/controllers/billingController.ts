/**
 * Billing Controller
 * 
 * Handles all billing-related operations including monthly billing summaries,
 * invoice generation, and customer billing history.
 */

import { Request, Response } from 'express';
import { db, COLLECTIONS } from '../config/firebase.js';
import {
  CustomerBillingSummary,
  DailyDeliveryRecord,
  ApiResponse,
  Customer,
  Settings,
  Shift,
} from '../types/index.js';

const customersCollection = db.collection(COLLECTIONS.CUSTOMERS);
const deliveriesCollection = db.collection(COLLECTIONS.DELIVERIES);
const settingsCollection = db.collection(COLLECTIONS.SETTINGS);

/**
 * Get monthly billing summary for all customers
 */
export const getMonthlyBilling = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Month and year are required',
      };
      res.status(400).json(response);
      return;
    }
    
    const monthNum = parseInt(month as string, 10);
    const yearNum = parseInt(year as string, 10);
    
    // Calculate date range for the month
    const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${lastDay}`;
    
    // Get all active customers
    const customersSnapshot = await customersCollection
      .where('isActive', '==', true)
      .orderBy('name')
      .get();
    
    const billingData: CustomerBillingSummary[] = [];
    
    for (const customerDoc of customersSnapshot.docs) {
      const customer = { id: customerDoc.id, ...customerDoc.data() } as Customer;
      
      // Get all deliveries for this customer in the month
      const deliveriesSnapshot = await deliveriesCollection
        .where('customerId', '==', customer.id)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .where('delivered', '==', true)
        .get();
      
      // Calculate totals
      let totalLiters = 0;
      const dailyMap = new Map<string, { morning: number; evening: number }>();
      
      deliveriesSnapshot.docs.forEach((doc) => {
        const delivery = doc.data();
        const amount = delivery.actualAmount || 0;
        totalLiters += amount;
        
        const existing = dailyMap.get(delivery.date) || { morning: 0, evening: 0 };
        if (delivery.shift === Shift.MORNING) {
          existing.morning += amount;
        } else {
          existing.evening += amount;
        }
        dailyMap.set(delivery.date, existing);
      });
      
      // Convert to daily breakdown array
      const dailyBreakdown: DailyDeliveryRecord[] = Array.from(dailyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, amounts]) => ({
          date,
          morningAmount: amounts.morning,
          eveningAmount: amounts.evening,
          totalAmount: amounts.morning + amounts.evening,
        }));
      
      const totalAmount = totalLiters * customer.pricePerLiter;
      
      billingData.push({
        customerId: customer.id,
        customerName: customer.name,
        customerAddress: customer.address,
        month: monthNum,
        year: yearNum,
        totalLiters,
        pricePerLiter: customer.pricePerLiter,
        totalAmount,
        dailyBreakdown,
      });
    }
    
    const response: ApiResponse<CustomerBillingSummary[]> = {
      success: true,
      data: billingData,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching monthly billing:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch monthly billing',
    };
    res.status(500).json(response);
  }
};

/**
 * Get billing details for a specific customer
 */
export const getCustomerBilling = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { customerId } = req.params;
    const { month, year } = req.query;
    
    if (!month || !year) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Month and year are required',
      };
      res.status(400).json(response);
      return;
    }
    
    const monthNum = parseInt(month as string, 10);
    const yearNum = parseInt(year as string, 10);
    
    // Get customer
    const customerDoc = await customersCollection.doc(customerId).get();
    
    if (!customerDoc.exists) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Customer not found',
      };
      res.status(404).json(response);
      return;
    }
    
    const customer = { id: customerDoc.id, ...customerDoc.data() } as Customer;
    
    // Calculate date range
    const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${lastDay}`;
    
    // Get deliveries
    const deliveriesSnapshot = await deliveriesCollection
      .where('customerId', '==', customerId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .where('delivered', '==', true)
      .get();
    
    let totalLiters = 0;
    const dailyMap = new Map<string, { morning: number; evening: number }>();
    
    deliveriesSnapshot.docs.forEach((doc) => {
      const delivery = doc.data();
      const amount = delivery.actualAmount || 0;
      totalLiters += amount;
      
      const existing = dailyMap.get(delivery.date) || { morning: 0, evening: 0 };
      if (delivery.shift === Shift.MORNING) {
        existing.morning += amount;
      } else {
        existing.evening += amount;
      }
      dailyMap.set(delivery.date, existing);
    });
    
    const dailyBreakdown: DailyDeliveryRecord[] = Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amounts]) => ({
        date,
        morningAmount: amounts.morning,
        eveningAmount: amounts.evening,
        totalAmount: amounts.morning + amounts.evening,
      }));
    
    // Get business settings for invoice
    const settingsDoc = await settingsCollection.doc('default').get();
    const settings = settingsDoc.exists ? settingsDoc.data() as Settings : null;
    
    const billingDetail: CustomerBillingSummary & { settings?: Settings | null } = {
      customerId: customer.id,
      customerName: customer.name,
      customerAddress: customer.address,
      month: monthNum,
      year: yearNum,
      totalLiters,
      pricePerLiter: customer.pricePerLiter,
      totalAmount: totalLiters * customer.pricePerLiter,
      dailyBreakdown,
      settings,
    };
    
    const response: ApiResponse<typeof billingDetail> = {
      success: true,
      data: billingDetail,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching customer billing:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch customer billing',
    };
    res.status(500).json(response);
  }
};

/**
 * Get estimated revenue for today
 */
export const getTodayRevenue = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all deliveries for today
    const deliveriesSnapshot = await deliveriesCollection
      .where('date', '==', today)
      .where('delivered', '==', true)
      .get();
    
    let totalRevenue = 0;
    const customerAmounts = new Map<string, number>();
    
    deliveriesSnapshot.docs.forEach((doc) => {
      const delivery = doc.data();
      const existing = customerAmounts.get(delivery.customerId) || 0;
      customerAmounts.set(delivery.customerId, existing + (delivery.actualAmount || delivery.quantity || 0));
    });
    
    // Calculate revenue based on customer prices
    for (const [customerId, amount] of customerAmounts) {
      const customerDoc = await customersCollection.doc(customerId).get();
      if (customerDoc.exists) {
        const pricePerLiter = customerDoc.data()?.pricePerLiter || 0;
        totalRevenue += amount * pricePerLiter;
      }
    }
    
    const response: ApiResponse<{ revenue: number; date: string }> = {
      success: true,
      data: { revenue: totalRevenue, date: today },
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error calculating today revenue:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to calculate today revenue',
    };
    res.status(500).json(response);
  }
};

/**
 * Customer Invoice Response Type
 */
interface CustomerInvoiceResponse {
  customer: {
    id: string;
    name: string;
    address: string;
    pricePerLiter: number;
  };
  totalLiters: number;
  totalAmount: number;
  dailyBreakdown: Array<{
    date: string;
    morning: number;
    evening: number;
  }>;
}

/**
 * Get customer invoice with detailed daily breakdown
 */
export const getCustomerInvoice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { customerId } = req.params;
    const { month, year } = req.query;
    
    if (!month || !year) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Month and year are required',
      };
      res.status(400).json(response);
      return;
    }
    
    const monthNum = parseInt(month as string, 10);
    const yearNum = parseInt(year as string, 10);
    
    // Get customer
    const customerDoc = await customersCollection.doc(customerId).get();
    
    if (!customerDoc.exists) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Customer not found',
      };
      res.status(404).json(response);
      return;
    }
    
    const customer = { id: customerDoc.id, ...customerDoc.data() } as Customer;
    
    // Calculate date range
    const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${lastDay}`;
    
    // Get deliveries
    const deliveriesSnapshot = await deliveriesCollection
      .where('customerId', '==', customerId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .where('delivered', '==', true)
      .get();
    
    let totalLiters = 0;
    const dailyMap = new Map<string, { morning: number; evening: number }>();
    
    deliveriesSnapshot.docs.forEach((doc) => {
      const delivery = doc.data();
      const amount = delivery.actualAmount || delivery.quantity || 0;
      totalLiters += amount;
      
      const existing = dailyMap.get(delivery.date) || { morning: 0, evening: 0 };
      if (delivery.shift === Shift.MORNING) {
        existing.morning += amount;
      } else {
        existing.evening += amount;
      }
      dailyMap.set(delivery.date, existing);
    });
    
    const dailyBreakdown = Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amounts]) => ({
        date,
        morning: amounts.morning,
        evening: amounts.evening,
      }));
    
    const invoice: CustomerInvoiceResponse = {
      customer: {
        id: customer.id,
        name: customer.name,
        address: customer.address,
        pricePerLiter: customer.pricePerLiter,
      },
      totalLiters,
      totalAmount: totalLiters * customer.pricePerLiter,
      dailyBreakdown,
    };
    
    const response: ApiResponse<CustomerInvoiceResponse> = {
      success: true,
      data: invoice,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching customer invoice:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch customer invoice',
    };
    res.status(500).json(response);
  }
};
