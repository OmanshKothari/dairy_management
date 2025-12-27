/**
 * Billing Controller
 * 
 * Handles all billing-related operations including monthly billing summaries,
 * invoice generation, and customer billing history.
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import {
  CustomerBillingSummary,
  DailyDeliveryRecord,
  ApiResponse,
  Customer,
  Settings,
  Shift,
} from '../types/index.js';

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
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    
    // Get all deliveries for this month
    const allDeliveries = await prisma.delivery.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        delivered: true,
      },
    });
    
    // Group deliveries by customer
    const deliveryMap = new Map<string, typeof allDeliveries>();
    allDeliveries.forEach(d => {
       const list = deliveryMap.get(d.customerId) || [];
       list.push(d);
       deliveryMap.set(d.customerId, list);
    });

    const billingData: CustomerBillingSummary[] = [];
    
    for (const customer of customers) {
      const customerDeliveries = deliveryMap.get(customer.id) || [];
      
      // Calculate totals
      let totalLiters = 0;
      const dailyMap = new Map<string, { morning: number; evening: number }>();
      
      customerDeliveries.forEach((delivery) => {
        const amount = delivery.actualAmount || 0;
        totalLiters += amount;
        
        const dateStr = delivery.date as unknown as string;
        const existing = dailyMap.get(dateStr) || { morning: 0, evening: 0 };
        if (delivery.shift === Shift.MORNING) {
          existing.morning += amount;
        } else {
          existing.evening += amount;
        }
        dailyMap.set(dateStr, existing);
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
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    
    if (!customer) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Customer not found',
      };
      res.status(404).json(response);
      return;
    }
    
    // Calculate date range
    const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${lastDay}`;
    
    // Get deliveries
    const deliveries = await prisma.delivery.findMany({
      where: {
        customerId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        delivered: true,
      },
    });
    
    let totalLiters = 0;
    const dailyMap = new Map<string, { morning: number; evening: number }>();
    
    deliveries.forEach((delivery) => {
      const amount = delivery.actualAmount || 0;
      totalLiters += amount;
      
      const dateStr = delivery.date as unknown as string;
      const existing = dailyMap.get(dateStr) || { morning: 0, evening: 0 };
      if (delivery.shift === Shift.MORNING) {
        existing.morning += amount;
      } else {
        existing.evening += amount;
      }
      dailyMap.set(dateStr, existing);
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
    const settings = await prisma.settings.findUnique({ where: { id: 1 }});
    
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
      settings: settings as unknown as Settings,
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
    const deliveries = await prisma.delivery.findMany({
      where: {
        date: today,
        delivered: true,
      },
      include: {
        customer: true,
      }
    });
    
    let totalRevenue = 0;
    
    deliveries.forEach((delivery) => {
        const amount = delivery.actualAmount || 0;
        const price = delivery.customer?.pricePerLiter || 0;
        totalRevenue += amount * price;
    });
    
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
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    
    if (!customer) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Customer not found',
      };
      res.status(404).json(response);
      return;
    }
    
    // Calculate date range
    const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${lastDay}`;
    
    // Get deliveries
    const deliveries = await prisma.delivery.findMany({
      where: {
        customerId,
        date: {
            gte: startDate,
            lte: endDate
        },
        delivered: true,
      }
    });
    
    let totalLiters = 0;
    const dailyMap = new Map<string, { morning: number; evening: number }>();
    
    deliveries.forEach((delivery) => {
      const amount = delivery.actualAmount || 0;
      totalLiters += amount;
      
      const dateStr = delivery.date as unknown as string;
      const existing = dailyMap.get(dateStr) || { morning: 0, evening: 0 };
      if (delivery.shift === Shift.MORNING) {
        existing.morning += amount;
      } else {
        existing.evening += amount;
      }
      dailyMap.set(dateStr, existing);
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
