/**
 * Dashboard Controller
 * 
 * Handles dashboard statistics and overview data including
 * daily totals, weekly charts, and quick stats.
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import {
  DashboardStats,
  WeeklyDeliveryData,
  ApiResponse,
  Shift,
} from '../types/index.js';

/**
 * Get the start of the current week (Monday)
 */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Format date as YYYY-MM-DD
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const today = new Date();
    const todayStr = formatDate(today);
    
    // Get current shift based on time
    const currentHour = today.getHours();
    const currentShift = currentHour < 12 ? Shift.MORNING : Shift.EVENING;
    
    // 1. Get total milk delivered today & revenue calculation
    const todayDeliveries = await prisma.delivery.findMany({
      where: {
        date: todayStr,
        delivered: true,
      },
      include: {
        customer: true,
      },
    });
    
    let totalMilkToday = 0;
    let estimatedRevenueToday = 0;
    
    todayDeliveries.forEach((delivery) => {
      const amount = delivery.actualAmount || 0;
      totalMilkToday += amount;
      
      const pricePerLiter = delivery.customer?.pricePerLiter || 0;
      estimatedRevenueToday += amount * pricePerLiter;
    });
    
    // 3. Get active customers count
    const activeCustomers = await prisma.customer.count({
      where: { isActive: true },
    });
    
    // 4. Calculate current stock (Total In - Total Out)
    const stockAgg = await prisma.stock.aggregate({ _sum: { quantity: true } });
    const totalStockIn = stockAgg._sum.quantity || 0;
    
    const deliveryAgg = await prisma.delivery.aggregate({ 
        where: { delivered: true },
        _sum: { actualAmount: true } 
    });
    const totalDelivered = deliveryAgg._sum.actualAmount || 0;
    
    const currentStock = Math.max(0, totalStockIn - totalDelivered);
    
    // Get max capacity from settings
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const maxCapacity = settings?.maxCapacity || 2000;
    
    const stockPercentage = Math.min((currentStock / maxCapacity) * 100, 100);
    const lowStockAlert = stockPercentage < 20;
    
    // 5. Get pending deliveries for current shift
    const allCustomers = await prisma.customer.findMany({
      where: { isActive: true },
    });

    // Get who has received delivery this shift
    const satisfiedCustomers = new Set(
        // We can optimize this by adding shift filter to todayDeliveries if we only fetched today's deliveries for *all* shifts?
        // But todayDeliveries fetched above is for *all* shifts of today.
        todayDeliveries
            .filter(d => d.shift === currentShift && d.delivered)
            .map(d => d.customerId)
    );
    
    let pendingDeliveries = 0;
    allCustomers.forEach((customer) => {
      const quota = currentShift === Shift.MORNING 
        ? customer.morningQuota 
        : customer.eveningQuota;
      
      if (quota > 0 && !satisfiedCustomers.has(customer.id)) {
        pendingDeliveries++;
      }
    });
    
    // 6. Get weekly delivery overview
    const weekStart = getWeekStart(today);
    const weekDates: string[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        weekDates.push(formatDate(d));
    }

    const weeklyAgg = await prisma.delivery.groupBy({
        by: ['date'],
        where: {
            date: { in: weekDates },
            delivered: true,
        },
        _sum: {
            actualAmount: true,
        },
    });

    const weeklyMap = new Map<string, number>();
    weeklyAgg.forEach(item => {
        weeklyMap.set(item.date as unknown as string, item._sum.actualAmount || 0);
    });
    
    const weeklyOverview: WeeklyDeliveryData[] = weekDates.map((dateStr, index) => ({
        day: dayNames[index],
        amount: weeklyMap.get(dateStr) || 0
    }));
    
    const stats: DashboardStats = {
      totalMilkToday,
      estimatedRevenueToday,
      activeCustomers,
      currentStock,
      maxCapacity,
      stockPercentage,
      lowStockAlert,
      pendingDeliveries,
      weeklyOverview,
    };
    
    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: stats,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch dashboard statistics',
    };
    res.status(500).json(response);
  }
};

/**
 * Get comparison with yesterday
 */
export const getYesterdayComparison = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(yesterday);
    
    const todayAgg = await prisma.delivery.aggregate({
        where: { date: todayStr, delivered: true },
        _sum: { actualAmount: true }
    });
    const todayTotal = todayAgg._sum.actualAmount || 0;

    const yesterdayAgg = await prisma.delivery.aggregate({
        where: { date: yesterdayStr, delivered: true },
        _sum: { actualAmount: true }
    });
    const yesterdayTotal = yesterdayAgg._sum.actualAmount || 0;
    
    // Calculate percentage change
    let percentageChange = 0;
    if (yesterdayTotal > 0) {
      percentageChange = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
    }
    
    const response: ApiResponse<{
      today: number;
      yesterday: number;
      percentageChange: number;
    }> = {
      success: true,
      data: {
        today: todayTotal,
        yesterday: yesterdayTotal,
        percentageChange: Math.round(percentageChange),
      },
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching comparison:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch comparison data',
    };
    res.status(500).json(response);
  }
};

/**
 * Get delivery trends (daily totals) for a date range
 */
export const getDeliveryTrends = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate, customerId } = req.query;
    
    // Default to last 30 days if not provided
    let start = startDate ? new Date(String(startDate)) : new Date();
    let end = endDate ? new Date(String(endDate)) : new Date();
    
    if (!startDate) {
        start.setDate(end.getDate() - 30);
    }

    const whereClause: any = {
        date: {
            gte: formatDate(start),
            lte: formatDate(end),
        },
        delivered: true,
    };

    if (customerId && customerId !== 'all') {
        whereClause.customerId = String(customerId);
    }

    const deliveries = await prisma.delivery.groupBy({
        by: ['date'],
        where: whereClause,
        _sum: {
            actualAmount: true,
        },
        orderBy: {
            date: 'asc',
        },
    });

    const data = deliveries.map(d => ({
        date: d.date,
        amount: d._sum.actualAmount || 0,
    }));

    const response: ApiResponse<any[]> = {
        success: true,
        data,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching delivery trends:', error);
    const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch delivery trends',
    };
    res.status(500).json(response);
  }
};

/**
 * Get source statistics (collection by source)
 */
export const getSourceStats = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      
      // Default to last 30 days if not provided
      let start = startDate ? new Date(String(startDate)) : new Date();
      let end = endDate ? new Date(String(endDate)) : new Date();
      
      if (!startDate) {
          start.setDate(end.getDate() - 30);
      }
  
      const stocks = await prisma.stock.findMany({
          where: {
              date: {
                  gte: formatDate(start),
                  lte: formatDate(end),
              },
          },
      });

      // Group by sourceName manually since we want display names
      const sourceMap = new Map<string, number>();
      
      stocks.forEach(stock => {
          const name = stock.sourceName || 'Unknown';
          const qty = stock.quantity || 0;
          sourceMap.set(name, (sourceMap.get(name) || 0) + qty);
      });

      const data = Array.from(sourceMap.entries()).map(([name, value]) => ({
          name,
          value
      }));
  
      const response: ApiResponse<any[]> = {
          success: true,
          data,
      };
  
      res.json(response);
    } catch (error) {
      console.error('Error fetching source stats:', error);
      const response: ApiResponse<null> = {
          success: false,
          error: 'Failed to fetch source stats',
      };
      res.status(500).json(response);
    }
  };
