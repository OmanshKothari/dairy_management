/**
 * API Routes Configuration
 * 
 * Defines all API endpoints for the Daily Dairy Manager application.
 */

import { Router } from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomersByCategory,
} from '../controllers/customerController.js';
import {
  getDeliveriesByDateAndShift,
  upsertDelivery,
  bulkUpdateDeliveries,
  autofillDeliveries,
  clearDeliveries,
  getTodayTotal,
} from '../controllers/deliveryController.js';
import {
  getAllStock,
  getRecentCollections,
  createStock,
  deleteStock,
  getCurrentInventory,
  getStockSources,
} from '../controllers/stockController.js';
import {
  getMonthlyBilling,
  getCustomerBilling,
  getCustomerInvoice,
  getTodayRevenue,
} from '../controllers/billingController.js';
import {
  getDashboardStats,
  getYesterdayComparison,
} from '../controllers/dashboardController.js';
import {
  getSettings,
  updateSettings,
  resetSettings,
} from '../controllers/settingsController.js';

const router = Router();

// ============================================================================
// Customer Routes
// ============================================================================

/**
 * @route   GET /api/customers
 * @desc    Get all customers with optional filtering
 * @query   category (optional) - Filter by 'regular' or 'variable'
 * @query   active (optional) - Filter by active status
 */
router.get('/customers', getAllCustomers);

/**
 * @route   GET /api/customers/category/:category
 * @desc    Get customers by category
 * @param   category - 'regular' or 'variable'
 */
router.get('/customers/category/:category', getCustomersByCategory);

/**
 * @route   GET /api/customers/:id
 * @desc    Get a single customer by ID
 */
router.get('/customers/:id', getCustomerById);

/**
 * @route   POST /api/customers
 * @desc    Create a new customer
 * @body    { name, address, phone?, category, morningQuota, eveningQuota, pricePerLiter }
 */
router.post('/customers', createCustomer);

/**
 * @route   PUT /api/customers/:id
 * @desc    Update an existing customer
 * @body    Partial customer data
 */
router.put('/customers/:id', updateCustomer);

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete a customer (soft delete by default)
 * @query   permanent (optional) - Set to 'true' for permanent deletion
 */
router.delete('/customers/:id', deleteCustomer);

// ============================================================================
// Delivery Routes
// ============================================================================

/**
 * @route   GET /api/deliveries
 * @desc    Get deliveries for a specific date and shift
 * @query   date - Date in YYYY-MM-DD format
 * @query   shift - 'morning' or 'evening'
 */
router.get('/deliveries', getDeliveriesByDateAndShift);

/**
 * @route   GET /api/deliveries/today-total
 * @desc    Get total deliveries for today
 */
router.get('/deliveries/today-total', getTodayTotal);

/**
 * @route   POST /api/deliveries
 * @desc    Create or update a single delivery
 * @body    { customerId, date, shift, actualAmount, delivered, notes? }
 */
router.post('/deliveries', upsertDelivery);

/**
 * @route   POST /api/deliveries/bulk
 * @desc    Bulk update deliveries for a date and shift
 * @body    { date, shift, deliveries: [{ customerId, actualAmount, delivered, notes? }] }
 */
router.post('/deliveries/bulk', bulkUpdateDeliveries);

/**
 * @route   POST /api/deliveries/autofill
 * @desc    Autofill deliveries with customer quotas
 * @body    { date, shift }
 */
router.post('/deliveries/autofill', autofillDeliveries);

/**
 * @route   POST /api/deliveries/clear
 * @desc    Clear all deliveries for a date and shift
 * @body    { date, shift }
 */
router.post('/deliveries/clear', clearDeliveries);

// ============================================================================
// Stock Routes
// ============================================================================

/**
 * @route   GET /api/stock
 * @desc    Get all stock records with optional date filtering
 * @query   startDate (optional) - Filter from this date
 * @query   endDate (optional) - Filter to this date
 * @query   limit (optional) - Number of records (default: 50)
 */
router.get('/stock', getAllStock);

/**
 * @route   GET /api/stock/recent
 * @desc    Get recent stock collections
 * @query   limit (optional) - Number of records (default: 10)
 */
router.get('/stock/recent', getRecentCollections);

/**
 * @route   GET /api/stock/inventory
 * @desc    Get current inventory level
 */
router.get('/stock/inventory', getCurrentInventory);

/**
 * @route   GET /api/stock/sources
 * @desc    Get list of stock sources
 */
router.get('/stock/sources', getStockSources);

/**
 * @route   POST /api/stock
 * @desc    Record a new stock collection
 * @body    { date, shift, source, quantity }
 */
router.post('/stock', createStock);

/**
 * @route   DELETE /api/stock/:id
 * @desc    Delete a stock record
 */
router.delete('/stock/:id', deleteStock);

// ============================================================================
// Billing Routes
// ============================================================================

/**
 * @route   GET /api/billing/monthly
 * @desc    Get monthly billing summary for all customers
 * @query   month - Month number (1-12)
 * @query   year - Year (e.g., 2025)
 */
router.get('/billing/monthly', getMonthlyBilling);

/**
 * @route   GET /api/billing/customer/:customerId
 * @desc    Get billing details for a specific customer
 * @query   month - Month number (1-12)
 * @query   year - Year (e.g., 2025)
 */
router.get('/billing/customer/:customerId', getCustomerBilling);

/**
 * @route   GET /api/billing/customer/:customerId/invoice
 * @desc    Get customer invoice with daily breakdown
 * @query   month - Month number (1-12)
 * @query   year - Year (e.g., 2025)
 */
router.get('/billing/customer/:customerId/invoice', getCustomerInvoice);

/**
 * @route   GET /api/billing/today-revenue
 * @desc    Get estimated revenue for today
 */
router.get('/billing/today-revenue', getTodayRevenue);

// ============================================================================
// Dashboard Routes
// ============================================================================

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * @route   GET /api/dashboard/comparison
 * @desc    Get comparison with yesterday
 */
router.get('/dashboard/comparison', getYesterdayComparison);

// ============================================================================
// Settings Routes
// ============================================================================

/**
 * @route   GET /api/settings
 * @desc    Get application settings
 */
router.get('/settings', getSettings);

/**
 * @route   PUT /api/settings
 * @desc    Update application settings
 * @body    Partial settings data
 */
router.put('/settings', updateSettings);

/**
 * @route   POST /api/settings/reset
 * @desc    Reset settings to defaults
 */
router.post('/settings/reset', resetSettings);

export default router;
