/**
 * Customer Controller
 * 
 * Handles all customer-related business logic including CRUD operations,
 * filtering by category, and customer management.
 */

import { Request, Response } from 'express';
import { db, COLLECTIONS } from '../config/firebase.js';
import {
  Customer,
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerCategory,
  ApiResponse,
} from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const customersCollection = db.collection(COLLECTIONS.CUSTOMERS);

/**
 * Get all customers with optional filtering
 */
export const getAllCustomers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category, active } = req.query;
    
    let query: FirebaseFirestore.Query = customersCollection;
    
    // Filter by category if provided
    if (category && Object.values(CustomerCategory).includes(category as CustomerCategory)) {
      query = query.where('category', '==', category);
    }
    
    // Filter by active status if provided
    if (active !== undefined) {
      query = query.where('isActive', '==', active === 'true');
    }
    
    const snapshot = await query.orderBy('name').get();
    
    const customers: Customer[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Customer[];
    
    const response: ApiResponse<Customer[]> = {
      success: true,
      data: customers,
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
    
    const doc = await customersCollection.doc(id).get();
    
    if (!doc.exists) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Customer not found',
      };
      res.status(404).json(response);
      return;
    }
    
    const customer: Customer = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
    } as Customer;
    
    const response: ApiResponse<Customer> = {
      success: true,
      data: customer,
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
    
    const id = uuidv4();
    const now = new Date();
    
    const newCustomer: Customer = {
      id,
      ...customerData,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    
    await customersCollection.doc(id).set({
      ...newCustomer,
      createdAt: now,
      updatedAt: now,
    });
    
    const response: ApiResponse<Customer> = {
      success: true,
      data: newCustomer,
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
    
    const docRef = customersCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Customer not found',
      };
      res.status(404).json(response);
      return;
    }
    
    const updatedData = {
      ...updateData,
      updatedAt: new Date(),
    };
    
    await docRef.update(updatedData);
    
    const updatedDoc = await docRef.get();
    const customer: Customer = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data()?.createdAt?.toDate(),
      updatedAt: updatedDoc.data()?.updatedAt?.toDate(),
    } as Customer;
    
    const response: ApiResponse<Customer> = {
      success: true,
      data: customer,
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
    
    const docRef = customersCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Customer not found',
      };
      res.status(404).json(response);
      return;
    }
    
    if (permanent === 'true') {
      // Permanent delete
      await docRef.delete();
    } else {
      // Soft delete
      await docRef.update({
        isActive: false,
        updatedAt: new Date(),
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
    
    const snapshot = await customersCollection
      .where('category', '==', category)
      .where('isActive', '==', true)
      .orderBy('name')
      .get();
    
    const customers: Customer[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Customer[];
    
    const response: ApiResponse<Customer[]> = {
      success: true,
      data: customers,
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
