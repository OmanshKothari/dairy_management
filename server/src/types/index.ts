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
 * Source Model Interface
 */
export interface Source {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Customer interface
 * Represents a milk delivery customer with their quotas and pricing
 */
export interface Customer {
  /** Unique identifier for the customer */
  id: string;
  /** Full name of the customer */
  name: string;
  /** Delivery address of the customer */
  address: string;
  /** Contact phone number */
  phone?: string | null;
  /** Category of the customer */
  category: CustomerCategory;
  /** Default morning delivery amount in liters */
  morningQuota: number;
  /** Default evening delivery amount in liters */
  eveningQuota: number;
  /** Customer-specific price per liter */
  pricePerLiter: number;
  /** Whether the customer record is active */
  isActive: boolean;
  /** Timestamp when the customer record was created */
  createdAt: Date;
  /** Timestamp when the customer record was last updated */
  updatedAt: Date;
}

/**
 * Customer creation DTO
 */
export interface CreateCustomerDTO {
  /** Full name of the customer */
  name: string;
  /** Delivery address of the customer */
  address: string;
  /** Contact phone number */
  phone?: string;
  /** Category of the customer */
  category: CustomerCategory;
  /** Default morning delivery amount in liters */
  morningQuota: number;
  /** Default evening delivery amount in liters */
  eveningQuota: number;
  /** Customer-specific price per liter */
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
  /** Unique identifier for the delivery record */
  id: string;
  /** Customer ID associated with the delivery */
  customerId: string;
  /** Customer name associated with the delivery */
  customerName: string;
  /** Delivery date in YYYY-MM-DD format */
  date: string;
  /** Shift of the delivery (morning/afternoon) */
  shift: Shift;
  /** Expected delivery amount in liters */
  actualAmount: number;   // Actually delivered amount
  delivered: boolean;     // Whether delivery was made
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Delivery creation DTO
 */
export interface CreateDeliveryDTO {
  /** Customer ID associated with the delivery */
  customerId: string;
  /** Delivery date in YYYY-MM-DD format */
  date: string;
  /** Shift of the delivery (morning/afternoon) */
  shift: Shift;
  /** Actually delivered amount in liters */
  actualAmount: number;
  /** Whether delivery was made */
  delivered: boolean;
  /** Additional notes about the delivery */
  notes?: string;
}

/**
 * Bulk delivery update DTO
 */
export interface BulkDeliveryUpdateDTO {
  /** Delivery date in YYYY-MM-DD format */
  date: string;
  /** Shift of the delivery (morning/afternoon) */
  shift: Shift;
  /** Array of deliveries to update */
  deliveries: Array<{
    /** Customer ID associated with the delivery */
    customerId: string;
    /** Actually delivered amount in liters */
    actualAmount: number;
    /** Whether delivery was made */
    delivered: boolean;
    notes?: string | null;
  }>;
}

/**
 * Stock record interface
 * Tracks milk collection/procurement
 */
export interface Stock {
  /** Unique identifier for the stock record */
  id: string;
  /** Delivery date in YYYY-MM-DD format */
  date: string;
  /** Shift of the delivery (morning/afternoon) */
  shift: Shift;
  /** Source of the stock (farm_a, farm_b, market, other) */
  source: StockSource;
  /** Human-readable source name */
  sourceName: string;
  /** Amount in liters */
  quantity: number;
  createdAt: Date;
}

/**
 * Stock creation DTO
 */
export interface CreateStockDTO {
  /** Delivery date in YYYY-MM-DD format */
  date: string;
  /** Shift of the delivery (morning/afternoon) */
  shift: Shift;
  /** Source of the stock (farm_a, farm_b, market, other) */
  source: StockSource;
  /** Amount in liters */
  quantity: number;
}

/**
 * Settings interface
 * Application-wide settings
 */
export interface Settings {
  /** Legal name of the dairy business */
  businessName: string;
  /** Physical location of the business */
  businessAddress: string;
  /** Primary contact number */
  businessPhone: string;
  /** Default rate applied to new customers */
  defaultPricePerLiter: number;
  /** Currency code (e.g., 'INR', 'USD') */
  currency: string;
  /** Currency symbol (e.g., '₹', '$') */
  currencySymbol: string;
  /** Maximum storage capacity in liters */
  maxCapacity: number;
  /** Default payment period in days */
  paymentTerms: number;
}

/**
 * Monthly billing summary for a customer
 */
export interface CustomerBillingSummary {
  /** Customer ID associated with the billing summary */
  customerId: string;
  /** Customer name associated with the billing summary */
  customerName: string;
  /** Customer address associated with the billing summary */
  customerAddress: string;
  /** Month of the billing summary */
  month: number;
  /** Year of the billing summary */
  year: number;
  /** Total liters delivered to the customer */
  totalLiters: number;
  /** Price per liter for the customer */
  pricePerLiter: number;
  /** Total amount for the billing summary */
  totalAmount: number;
  /** Arrears from previous months (positive means they owe, negative means credit) */
  previousBalance: number;
  /** Total amount paid during this month */
  paidAmount: number;
  /** Final amount due (totalAmount + previousBalance - paidAmount) */
  totalDue: number;
  /** Daily delivery records for the billing summary */
  dailyBreakdown: DailyDeliveryRecord[];
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
  remarks?: string | null;
  createdAt: Date;
  updatedAt: Date;
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
 * Daily delivery record for billing breakdown
 */
export interface DailyDeliveryRecord {
  /** Delivery date in YYYY-MM-DD format */
  date: string;
  /** Morning delivery amount in liters */
  morningAmount: number;
  /** Evening delivery amount in liters */
  eveningAmount: number;
  /** Total delivery amount in liters */
  totalAmount: number;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  /** Total volume of milk delivered today in liters */
  totalMilkToday: number;
  /** Estimated total revenue for today's deliveries */
  estimatedRevenueToday: number;
  /** Total number of currently active customers */
  activeCustomers: number;
  /** Current milk inventory level in liters */
  currentStock: number;
  /** Maximum storage capacity for milk in liters */
  maxCapacity: number;
  /** Percentage of storage capacity currently utilized */
  stockPercentage: number;
  /** Whether current stock levels have dropped below the safety threshold */
  lowStockAlert: boolean;
  /** Number of deliveries scheduled but not yet completed */
  pendingDeliveries: number;
  /** Array of daily delivery data for the past week */
  weeklyOverview: WeeklyDeliveryData[];
}

/**
 * Weekly delivery data for chart
 */
export interface WeeklyDeliveryData {
  /** Day of the week */
  day: string;
  /** Total delivery amount in liters */
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
