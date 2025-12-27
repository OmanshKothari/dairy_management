/**
 * Utility Functions
 * 
 * Common utility functions used throughout the application
 * for date formatting, calculations, and data manipulation.
 */

import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, addDays } from 'date-fns';
import { Shift, CustomerCategory } from '../types';

/**
 * Format a date string to display format
 */
export const formatDate = (date: string | Date, formatStr = 'dd/MM/yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Format a date to YYYY-MM-DD for API calls
 */
export const toApiDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Get today's date as a string (YYYY-MM-DD)
 */
export const getTodayString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Get the current shift based on time
 */
export const getCurrentShift = (): Shift => {
  const hour = new Date().getHours();
  return hour < 12 ? Shift.MORNING : Shift.EVENING;
};

/**
 * Get time-based greeting
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good Morning!';
  } else if (hour < 17) {
    return 'Good Afternoon!';
  } else {
    return 'Good Evening!';
  }
};

/**
 * Get the first and last day of a month
 */
export const getMonthRange = (year: number, month: number): { start: Date; end: Date } => {
  const date = new Date(year, month - 1);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
};

/**
 * Get the days of the current week (Monday to Sunday)
 */
export const getWeekDays = (): Date[] => {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

/**
 * Get month name from number
 */
export const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month - 1] || '';
};

/**
 * Get customer category display label
 */
export const getCategoryLabel = (category: CustomerCategory): string => {
  const labels: Record<CustomerCategory, string> = {
    [CustomerCategory.REGULAR]: 'Regular (Fixed Daily)',
    [CustomerCategory.VARIABLE]: 'Variable (Shop Owner)',
  };
  return labels[category] || category;
};

/**
 * Get shift display label
 */
export const getShiftLabel = (shift: Shift): string => {
  const labels: Record<Shift, string> = {
    [Shift.MORNING]: 'Morning',
    [Shift.EVENING]: 'Evening',
  };
  return labels[shift] || shift;
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Get initials from a name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Generate a random color based on string (for avatars)
 */
export const stringToColor = (str: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-cyan-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Clamp a number between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Format large numbers with K/M suffix
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};
