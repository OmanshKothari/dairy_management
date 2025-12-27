/**
 * Common UI Components
 * 
 * Reusable UI components used throughout the application.
 */

import React, { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

// ============================================================================
// Card Component
// ============================================================================

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md' 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`rounded-xl bg-white shadow-card ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

// ============================================================================
// Button Component
// ============================================================================

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

// ============================================================================
// Input Component
// ============================================================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftAddon?: ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftAddon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </label>
      )}
      <div className="relative">
        {leftAddon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {leftAddon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            leftAddon ? 'pl-10' : ''
          } ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

// ============================================================================
// Select Component
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  placeholder,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

// ============================================================================
// Modal Component
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`relative w-full ${sizeClasses[size]} mx-4 overflow-hidden rounded-2xl bg-white shadow-xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-blue-600 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// Loading Spinner
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
    </div>
  );
};

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="mb-4 text-gray-300">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  );
};

// ============================================================================
// Badge Component
// ============================================================================

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
};

// ============================================================================
// Toggle Switch
// ============================================================================

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
  };

  const sizes = sizeClasses[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${sizes.track}`}
    >
      <span
        className={`pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? sizes.translate : 'translate-x-0'
        } ${sizes.thumb}`}
      />
    </button>
  );
};
