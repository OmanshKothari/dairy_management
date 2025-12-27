/**
 * Shared TypeScript Types for Daily Dairy Manager
 * 
 * These types define the data structures used throughout the application
 * for customers, deliveries, stock management, and billing.
 */

/**
 * Customer category types
 * - REGULAR: Customers who buy a fixed amount daily (residential customers)
 * - VARIABLE: Shop owners who buy different amounts each day
 */
export enum CustomerCategory {
  REGULAR = 'regular',
  VARIABLE = 'variable',
}

/**
 * Delivery shift types
 */
export enum Shift {
  MORNING = 'morning',
  EVENING = 'evening',
}

/**
 * Stock source types
 */
export enum StockSource {
  FARM_A = 'farm_a',
  FARM_B = 'farm_b',
  MARKET = 'market',
  OTHER = 'other',
}

/**
 * Customer interface
 * Represents a milk delivery customer with their quotas and pricing
 */
export interface Customer {
  id: string;
  name: string;
  address: string;
  phone?: string;
  category: CustomerCategory;
  morningQuota: number;  // Default morning delivery amount in liters
  eveningQuota: number;  // Default evening delivery amount in liters
  pricePerLiter: number; // Customer-specific price per liter
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Customer creation DTO
 */
export interface CreateCustomerDTO {
  name: string;
  address: string;
  phone?: string;
  category: CustomerCategory;
  morningQuota: number;
  eveningQuota: number;
  pricePerLiter: number;
}

/**
 * Customer update DTO
 */
export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> {
  isActive?: boolean;
}

/**
 * Delivery record interface
 * Tracks individual milk deliveries to customers
 */
export interface Delivery {
  id: string;
  customerId: string;
  customerName: string;
  date: string;           // Format: YYYY-MM-DD
  shift: Shift;
  quota: number;          // Expected delivery amount
  actualAmount: number;   // Actually delivered amount
  delivered: boolean;     // Whether delivery was made
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Delivery creation DTO
 */
export interface CreateDeliveryDTO {
  customerId: string;
  date: string;
  shift: Shift;
  actualAmount: number;
  delivered: boolean;
  notes?: string;
}

/**
 * Bulk delivery update DTO
 */
export interface BulkDeliveryUpdateDTO {
  date: string;
  shift: Shift;
  deliveries: Array<{
    customerId: string;
    actualAmount: number;
    delivered: boolean;
    notes?: string;
  }>;
}

/**
 * Stock record interface
 * Tracks milk collection/procurement
 */
export interface Stock {
  id: string;
  date: string;           // Format: YYYY-MM-DD
  shift: Shift;
  source: StockSource;
  sourceName: string;     // Human-readable source name
  quantity: number;       // Amount in liters
  createdAt: Date;
}

/**
 * Stock creation DTO
 */
export interface CreateStockDTO {
  date: string;
  shift: Shift;
  source: StockSource;
  quantity: number;
}

/**
 * Settings interface
 * Application-wide settings
 */
export interface Settings {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  defaultPricePerLiter: number;
  currency: string;
  currencySymbol: string;
  maxCapacity: number;    // Maximum stock capacity in liters
  paymentTerms: number;   // Payment terms in days
}

/**
 * Monthly billing summary for a customer
 */
export interface CustomerBillingSummary {
  customerId: string;
  customerName: string;
  customerAddress: string;
  month: number;
  year: number;
  totalLiters: number;
  pricePerLiter: number;
  totalAmount: number;
  dailyBreakdown: DailyDeliveryRecord[];
}

/**
 * Daily delivery record for billing breakdown
 */
export interface DailyDeliveryRecord {
  date: string;
  morningAmount: number;
  eveningAmount: number;
  totalAmount: number;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalMilkToday: number;
  estimatedRevenueToday: number;
  activeCustomers: number;
  currentStock: number;
  maxCapacity: number;
  stockPercentage: number;
  lowStockAlert: boolean;
  pendingDeliveries: number;
  weeklyOverview: WeeklyDeliveryData[];
}

/**
 * Weekly delivery data for chart
 */
export interface WeeklyDeliveryData {
  day: string;
  amount: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
