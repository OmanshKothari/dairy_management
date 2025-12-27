/**
 * Customer Controller
 * 
 * Handles all customer-related business logic including CRUD operations,
 * filtering by category, and customer management.
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import {
  Customer,
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerCategory,
  ApiResponse,
} from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all customers with optional filtering
 */
export const getAllCustomers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category, active } = req.query;
    
    const where: any = {};
    
    // Filter by category if provided
    if (category && Object.values(CustomerCategory).includes(category as CustomerCategory)) {
      where.category = category;
    }
    
    // Filter by active status if provided
    if (active !== undefined) {
      where.isActive = active === 'true';
    }
    
    const customers = await prisma.customer.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });
    
    // Prisma returns Date objects, so we cast to our Customer interface (which expects Date)
    // The previous implementation mapped Timestamp to Date, but here it is already Date.
    
    const response: ApiResponse<Customer[]> = {
      success: true,
      data: customers as unknown as Customer[], 
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching customers:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch customers',
    };
    res.status(500).json(response);
  }
};

/**
 * Get a single customer by ID
 */
export const getCustomerById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const customer = await prisma.customer.findUnique({
      where: { id },
    });
    
    if (!customer) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Customer not found',
      };
      res.status(404).json(response);
      return;
    }
    
    const response: ApiResponse<Customer> = {
      success: true,
      data: customer as unknown as Customer,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching customer:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch customer',
    };
    res.status(500).json(response);
  }
};

/**
 * Create a new customer
 */
export const createCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const customerData: CreateCustomerDTO = req.body;
    
    const newCustomer = await prisma.customer.create({
      data: {
        ...customerData,
        isActive: true, // Default to true
      },
    });
    
    const response: ApiResponse<Customer> = {
      success: true,
      data: newCustomer as unknown as Customer,
      message: 'Customer created successfully',
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating customer:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to create customer',
    };
    res.status(500).json(response);
  }
};

/**
 * Update an existing customer
 */
export const updateCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateCustomerDTO = req.body;
    
    // check if exists
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
       const response: ApiResponse<null> = {
        success: false,
        error: 'Customer not found',
      };
      res.status(404).json(response);
      return;
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });
    
    const response: ApiResponse<Customer> = {
      success: true,
      data: updatedCustomer as unknown as Customer,
      message: 'Customer updated successfully',
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error updating customer:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to update customer',
    };
    res.status(500).json(response);
  }
};

/**
 * Delete a customer (soft delete by setting isActive to false)
 */
export const deleteCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
       const response: ApiResponse<null> = {
        success: false,
        error: 'Customer not found',
      };
      res.status(404).json(response);
      return;
    }
    
    if (permanent === 'true') {
      // Permanent delete
      await prisma.customer.delete({
        where: { id },
      });
    } else {
      // Soft delete
      await prisma.customer.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
    }
    
    const response: ApiResponse<null> = {
      success: true,
      message: permanent === 'true' 
        ? 'Customer permanently deleted' 
        : 'Customer deactivated successfully',
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error deleting customer:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to delete customer',
    };
    res.status(500).json(response);
  }
};

/**
 * Get customers by category
 */
export const getCustomersByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category } = req.params;
    
    if (!Object.values(CustomerCategory).includes(category as CustomerCategory)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid category. Must be "regular" or "variable"',
      };
      res.status(400).json(response);
      return;
    }
    
    const customers = await prisma.customer.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    const response: ApiResponse<Customer[]> = {
      success: true,
      data: customers as unknown as Customer[],
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching customers by category:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch customers',
    };
    res.status(500).json(response);
  }
};
