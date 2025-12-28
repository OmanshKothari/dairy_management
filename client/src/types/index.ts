/**
 * Client-side TypeScript Types
 * 
 * These types mirror the server types and define the data structures
 * used throughout the React application.
 */

/**
 * Customer category types
 * - REGULAR: Customers who buy a fixed amount daily (residential customers)
 * - VARIABLE: Shop owners who buy different amounts each day
 */
export enum CustomerCategory {
  REGULAR = 'REGULAR',
  VARIABLE = 'VARIABLE',
}

/**
 * Delivery shift types
 */
export enum Shift {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
}

/**
 * Stock source types
 */
export enum StockSource {
  FARM_A = 'FARM_A',
  FARM_B = 'FARM_B',
  MARKET = 'MARKET',
  OTHER = 'OTHER',
}

/**
 * Customer interface
 */
export interface Customer {
  id: string;
  name: string;
  address: string;
  phone?: string;
  category: CustomerCategory;
  morningQuota: number;
  eveningQuota: number;
  pricePerLiter: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Customer form data
 */
export interface CustomerFormData {
  name: string;
  address: string;
  phone?: string;
  category: CustomerCategory;
  morningQuota: number;
  eveningQuota: number;
  pricePerLiter: number;
}

/**
 * Delivery record interface
 */
export interface Delivery {
  id: string;
  customerId: string;
  customerName?: string;
  date: string;
  shift: Shift;
  quantity: number;
  delivered: boolean;
  notes?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/**
 * Delivery form data for the daily log
 */
export interface DeliveryEntry {
  customerId: string;
  quantity: number;
  delivered: boolean;
  notes?: string;
}

/**
 * Stock record interface
 */
export interface Stock {
  id: string;
  date: string;
  shift: Shift;
  source: string; // Changed from StockSource enum to string (ID)
  sourceName: string; // Added sourceName
  quantity: number;
  createdAt?: Date;
}

/**
 * Stock form data
 */
export interface StockFormData {
  date: string;
  shift: Shift;
  source: string; // Changed from StockSource enum to string
  quantity: number;
}

/**
 * Stock source option
 */
export interface StockSourceOption {
  value: StockSource;
  label: string;
}

/**
 * Settings interface
 */
export interface Settings {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  defaultPricePerLiter: number;
  currency: string;
  currencySymbol: string;
  maxCapacity: number;
  paymentTermsDays: number;
}

/**
 * Monthly billing summary for a customer
 */
export interface CustomerBillingSummary {
  customerId: string;
  customerName: string;
  customerAddress?: string;
  month: number;
  year: number;
  totalLiters: number;
  pricePerLiter: number;
  totalAmount: number;
  previousBalance: number;
  paidAmount: number;
  totalDue: number;
  dailyBreakdown?: DailyDeliveryRecord[];
}

/**
 * Payment record interface
 */
export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  month: number;
  year: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment creation DTO
 */
export interface CreatePaymentDTO {
  customerId: string;
  amount: number;
  date: string;
  month: number;
  year: number;
  remarks?: string;
}

/**
 * Daily breakdown for invoice
 */
export interface DailyBreakdown {
  date: string;
  morning: number;
  evening: number;
}

/**
 * Customer invoice data
 */
export interface CustomerInvoice {
  customer: {
    id: string;
    name: string;
    address: string;
    pricePerLiter: number;
  };
  totalLiters: number;
  totalAmount: number;
  dailyBreakdown: DailyBreakdown[];
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
 * Yesterday comparison data
 */
export interface YesterdayComparison {
  today: number;
  yesterday: number;
  percentageChange: number;
}

/**
 * Inventory data
 */
export interface InventoryData {
  currentInventory: number;
  maxCapacity: number;
  percentage: number;
  lowStock: boolean;
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
 * Navigation item for sidebar
 */
export interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}
