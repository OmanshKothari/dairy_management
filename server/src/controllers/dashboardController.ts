/**
 * Dashboard Controller
 * 
 * Handles dashboard statistics and overview data including
 * daily totals, weekly charts, and quick stats.
 */

import { Request, Response } from 'express';
import { db, COLLECTIONS } from '../config/firebase.js';
import {
  DashboardStats,
  WeeklyDeliveryData,
  ApiResponse,
  Shift,
} from '../types/index.js';

const customersCollection = db.collection(COLLECTIONS.CUSTOMERS);
const deliveriesCollection = db.collection(COLLECTIONS.DELIVERIES);
const stockCollection = db.collection(COLLECTIONS.STOCK);
const settingsCollection = db.collection(COLLECTIONS.SETTINGS);

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
    
    // 1. Get total milk delivered today
    const todayDeliveriesSnapshot = await deliveriesCollection
      .where('date', '==', todayStr)
      .where('delivered', '==', true)
      .get();
    
    let totalMilkToday = 0;
    const customerAmountsToday = new Map<string, number>();
    
    todayDeliveriesSnapshot.docs.forEach((doc) => {
      const delivery = doc.data();
      totalMilkToday += delivery.actualAmount || 0;
      const existing = customerAmountsToday.get(delivery.customerId) || 0;
      customerAmountsToday.set(delivery.customerId, existing + (delivery.actualAmount || 0));
    });
    
    // 2. Calculate estimated revenue today
    let estimatedRevenueToday = 0;
    for (const [customerId, amount] of customerAmountsToday) {
      const customerDoc = await customersCollection.doc(customerId).get();
      if (customerDoc.exists) {
        const pricePerLiter = customerDoc.data()?.pricePerLiter || 0;
        estimatedRevenueToday += amount * pricePerLiter;
      }
    }
    
    // 3. Get active customers count
    const activeCustomersSnapshot = await customersCollection
      .where('isActive', '==', true)
      .count()
      .get();
    const activeCustomers = activeCustomersSnapshot.data().count;
    
    // 4. Calculate current stock
    const stockSnapshot = await stockCollection.get();
    let totalStockIn = 0;
    stockSnapshot.docs.forEach((doc) => {
      totalStockIn += doc.data().quantity || 0;
    });
    
    const allDeliveriesSnapshot = await deliveriesCollection
      .where('delivered', '==', true)
      .get();
    let totalDelivered = 0;
    allDeliveriesSnapshot.docs.forEach((doc) => {
      totalDelivered += doc.data().actualAmount || 0;
    });
    
    const currentStock = Math.max(0, totalStockIn - totalDelivered);
    
    // Get max capacity from settings
    const settingsDoc = await settingsCollection.doc('default').get();
    const maxCapacity = settingsDoc.exists 
      ? settingsDoc.data()?.maxCapacity || 2000 
      : 2000;
    
    const stockPercentage = Math.min((currentStock / maxCapacity) * 100, 100);
    const lowStockAlert = stockPercentage < 20;
    
    // 5. Get pending deliveries for current shift
    const allCustomersSnapshot = await customersCollection
      .where('isActive', '==', true)
      .get();
    
    const deliveredCustomersToday = new Set<string>();
    todayDeliveriesSnapshot.docs.forEach((doc) => {
      if (doc.data().shift === currentShift && doc.data().delivered) {
        deliveredCustomersToday.add(doc.data().customerId);
      }
    });
    
    let pendingDeliveries = 0;
    allCustomersSnapshot.docs.forEach((doc) => {
      const customer = doc.data();
      const quota = currentShift === Shift.MORNING 
        ? customer.morningQuota 
        : customer.eveningQuota;
      
      if (quota > 0 && !deliveredCustomersToday.has(doc.id)) {
        pendingDeliveries++;
      }
    });
    
    // 6. Get weekly delivery overview
    const weekStart = getWeekStart(today);
    const weeklyOverview: WeeklyDeliveryData[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const dayStr = formatDate(day);
      
      const dayDeliveriesSnapshot = await deliveriesCollection
        .where('date', '==', dayStr)
        .where('delivered', '==', true)
        .get();
      
      let dayTotal = 0;
      dayDeliveriesSnapshot.docs.forEach((doc) => {
        dayTotal += doc.data().actualAmount || 0;
      });
      
      weeklyOverview.push({
        day: dayNames[i],
        amount: dayTotal,
      });
    }
    
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
    
    // Get today's deliveries
    const todaySnapshot = await deliveriesCollection
      .where('date', '==', todayStr)
      .where('delivered', '==', true)
      .get();
    
    let todayTotal = 0;
    todaySnapshot.docs.forEach((doc) => {
      todayTotal += doc.data().actualAmount || 0;
    });
    
    // Get yesterday's deliveries
    const yesterdaySnapshot = await deliveriesCollection
      .where('date', '==', yesterdayStr)
      .where('delivered', '==', true)
      .get();
    
    let yesterdayTotal = 0;
    yesterdaySnapshot.docs.forEach((doc) => {
      yesterdayTotal += doc.data().actualAmount || 0;
    });
    
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
