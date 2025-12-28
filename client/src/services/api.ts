/**
 * API Service
 * 
 * Centralized HTTP client for communicating with the backend server.
 * Uses Axios for HTTP requests with interceptors for error handling.
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  Customer,
  CustomerFormData,
  CustomerCategory,
  Delivery,
  DeliveryEntry,
  Stock,
  StockFormData,
  StockSourceOption,
  Settings,
  CustomerBillingSummary,
  CustomerInvoice,
  DashboardStats,
  YesterdayComparison,
  InventoryData,
  ApiResponse,
  Shift,
  CreatePaymentDTO,
  Payment,
} from '../types';

/**
 * Base API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Create Axios instance with default configuration
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Response interceptor for error handling
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<null>>) => {
    const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// ============================================================================
// Customer API
// ============================================================================

export const customerApi = {
  /**
   * Get all customers with optional filtering
   */
  getAll: async (category?: CustomerCategory, active?: boolean): Promise<Customer[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (active !== undefined) params.append('active', String(active));
    
    const response = await api.get<ApiResponse<Customer[]>>(`/customers?${params}`);
    return response.data.data || [];
  },

  /**
   * Get customers by category
   */
  getByCategory: async (category: CustomerCategory): Promise<Customer[]> => {
    const response = await api.get<ApiResponse<Customer[]>>(`/customers/category/${category}`);
    return response.data.data || [];
  },

  /**
   * Get a single customer by ID
   */
  getById: async (id: string): Promise<Customer> => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    if (!response.data.data) throw new Error('Customer not found');
    return response.data.data;
  },

  /**
   * Create a new customer
   */
  create: async (data: CustomerFormData): Promise<Customer> => {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    if (!response.data.data) throw new Error('Failed to create customer');
    return response.data.data;
  },

  /**
   * Update an existing customer
   */
  update: async (id: string, data: Partial<CustomerFormData>): Promise<Customer> => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    if (!response.data.data) throw new Error('Failed to update customer');
    return response.data.data;
  },

  /**
   * Delete a customer
   */
  delete: async (id: string, permanent = false): Promise<void> => {
    await api.delete(`/customers/${id}${permanent ? '?permanent=true' : ''}`);
  },
};

// ============================================================================
// Delivery API
// ============================================================================

export const deliveryApi = {
  /**
   * Get deliveries for a specific date and shift
   */
  getByDate: async (date: string, shift: Shift): Promise<Delivery[]> => {
    const response = await api.get<ApiResponse<Delivery[]>>(
      `/deliveries?date=${date}&shift=${shift}`
    );
    return response.data.data || [];
  },

  /**
   * Get today's total deliveries
   */
  getTodayTotal: async (): Promise<{ total: number; date: string }> => {
    const response = await api.get<ApiResponse<{ total: number; date: string }>>(
      '/deliveries/today-total'
    );
    return response.data.data || { total: 0, date: '' };
  },

  /**
   * Create or update a single delivery
   */
  upsert: async (data: {
    customerId: string;
    date: string;
    shift: Shift;
    quantity: number;
    delivered: boolean;
    notes?: string;
  }): Promise<Delivery> => {
    // Map quantity to actualAmount for backend
    const payload = {
      ...data,
      actualAmount: data.quantity,
    };
    const response = await api.post<ApiResponse<Delivery>>('/deliveries', payload);
    if (!response.data.data) throw new Error('Failed to save delivery');
    return response.data.data;
  },

  /**
   * Bulk update deliveries
   */
  bulkUpdate: async (
    date: string,
    shift: Shift,
    entries: DeliveryEntry[]
  ): Promise<void> => {
    await api.post('/deliveries/bulk', {
      date,
      shift,
      deliveries: entries.map(e => ({
        customerId: e.customerId,
        actualAmount: e.quantity, // Map quantity to actualAmount
        delivered: e.delivered,
        notes: e.notes,
      })),
    });
  },

  /**
   * Autofill deliveries with customer quotas
   */
  autofill: async (date: string, shift: Shift): Promise<{ count: number }> => {
    const response = await api.post<ApiResponse<{ count: number }>>('/deliveries/autofill', {
      date,
      shift,
    });
    return response.data.data || { count: 0 };
  },

  /**
   * Clear all deliveries for a date and shift
   */
  clear: async (date: string, shift: Shift): Promise<void> => {
    await api.post('/deliveries/clear', { date, shift });
  },

  /**
   * Get deliveries for a specific customer
   */
  getByCustomer: async (id: string, startDate?: string, endDate?: string): Promise<Delivery[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get<ApiResponse<Delivery[]>>(`/deliveries/customer/${id}?${params}`);
    return response.data.data || [];
  },
};

// ============================================================================
// Stock API
// ============================================================================

export const stockApi = {
  /**
   * Get all stock records
   */
  getAll: async (startDate?: string, endDate?: string, limit = 50): Promise<Stock[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', String(limit));
    
    const response = await api.get<ApiResponse<Stock[]>>(`/stock?${params}`);
    return response.data.data || [];
  },

  /**
   * Get recent stock collections
   */
  getRecent: async (limit = 10): Promise<Stock[]> => {
    const response = await api.get<ApiResponse<Stock[]>>(`/stock/recent?limit=${limit}`);
    return response.data.data || [];
  },

  /**
   * Get current inventory level
   */
  getInventory: async (): Promise<InventoryData> => {
    const response = await api.get<ApiResponse<InventoryData>>('/stock/inventory');
    return response.data.data || {
      currentInventory: 0,
      maxCapacity: 2000,
      percentage: 0,
      lowStock: false,
    };
  },

  /**
   * Get stock sources
   */
  getSources: async (): Promise<StockSourceOption[]> => {
    const response = await api.get<ApiResponse<StockSourceOption[]>>('/stock/sources');
    return response.data.data || [];
  },

  getAvailability: async (date: string): Promise<{ totalStock: number; totalDelivered: number }> => {
    const response = await api.get<ApiResponse<{ totalStock: number; totalDelivered: number }>>('/stock/availability', { params: { date } });
    return response.data.data || { totalStock: 0, totalDelivered: 0 };
  },

  /**
   * Create a new stock record
   */
  create: async (data: StockFormData): Promise<Stock> => {
    const response = await api.post<ApiResponse<Stock>>('/stock', data);
    if (!response.data.data) throw new Error('Failed to create stock record');
    return response.data.data;
  },

  /**
   * Delete a stock record
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/stock/${id}`);
  },
};

// ============================================================================
// Billing API
// ============================================================================

export const billingApi = {
  /**
   * Get monthly billing for all customers
   */
  getMonthly: async (year: number, month: number): Promise<CustomerBillingSummary[]> => {
    const response = await api.get<ApiResponse<CustomerBillingSummary[]>>(
      `/billing/monthly?month=${month}&year=${year}`
    );
    return response.data.data || [];
  },

  /**
   * Get billing details for a specific customer
   */
  getCustomerBilling: async (
    customerId: string,
    month: number,
    year: number
  ): Promise<CustomerBillingSummary> => {
    const response = await api.get<ApiResponse<CustomerBillingSummary>>(
      `/billing/customer/${customerId}?month=${month}&year=${year}`
    );
    if (!response.data.data) throw new Error('Billing data not found');
    return response.data.data;
  },

  /**
   * Get customer invoice with daily breakdown
   */
  getCustomerInvoice: async (
    customerId: string,
    year: number,
    month: number
  ): Promise<CustomerInvoice> => {
    const response = await api.get<ApiResponse<CustomerInvoice>>(
      `/billing/customer/${customerId}/invoice?month=${month}&year=${year}`
    );
    if (!response.data.data) throw new Error('Invoice not found');
    return response.data.data;
  },

  /**
   * Get today's revenue
   */
  getTodayRevenue: async (): Promise<{ revenue: number; date: string }> => {
    const response = await api.get<ApiResponse<{ revenue: number; date: string }>>(
      '/billing/today-revenue'
    );
    return response.data.data || { revenue: 0, date: '' };
  },

  /**
   * Record a payment
   */
  recordPayment: async (data: CreatePaymentDTO): Promise<Payment> => {
    const response = await api.post<ApiResponse<Payment>>('/billing/payment', data);
    if (!response.data.data) throw new Error('Failed to record payment');
    return response.data.data;
  },
};

// ============================================================================
// Dashboard API
// ============================================================================

export const dashboardApi = {
  /**
   * Get dashboard statistics
   */
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data || {
      totalMilkToday: 0,
      estimatedRevenueToday: 0,
      activeCustomers: 0,
      currentStock: 0,
      maxCapacity: 2000,
      stockPercentage: 0,
      lowStockAlert: false,
      pendingDeliveries: 0,
      weeklyOverview: [],
    };
  },

  /**
   * Get comparison with yesterday
   */
  getComparison: async (): Promise<YesterdayComparison> => {
    const response = await api.get<ApiResponse<YesterdayComparison>>('/dashboard/comparison');
    return response.data.data || {
      today: 0,
      yesterday: 0,
      percentageChange: 0,
    };
  },

  /**
   * Get delivery trends
   */
  getDeliveryTrends: async (
    startDate?: string,
    endDate?: string,
    customerId?: string
  ): Promise<any[]> => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (customerId) params.append('customerId', customerId);

      const response = await api.get<ApiResponse<any[]>>(`/dashboard/trends?${params}`);
      return response.data.data || [];
  },

  /**
   * Get source statistics
   */
  getSourceStats: async (startDate?: string, endDate?: string): Promise<any[]> => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get<ApiResponse<any[]>>(`/dashboard/sources?${params}`);
      return response.data.data || [];
  },
};

// ============================================================================
// Settings API
// ============================================================================

export const settingsApi = {
  /**
   * Get application settings
   */
  get: async (): Promise<Settings> => {
    const response = await api.get<ApiResponse<Settings>>('/settings');
    if (!response.data.data) throw new Error('Settings not found');
    return response.data.data;
  },

  /**
   * Update application settings
   */
  update: async (data: Partial<Settings>): Promise<Settings> => {
    const response = await api.put<ApiResponse<Settings>>('/settings', data);
    if (!response.data.data) throw new Error('Failed to update settings');
    return response.data.data;
  },

  /**
   * Reset settings to defaults
   */
  reset: async (): Promise<Settings> => {
    const response = await api.post<ApiResponse<Settings>>('/settings/reset');
    if (!response.data.data) throw new Error('Failed to reset settings');
    return response.data.data;
  },
};

export default api;
