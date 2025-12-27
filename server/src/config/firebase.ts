/**
 * Firebase Admin SDK Configuration
 * 
 * This module initializes the Firebase Admin SDK for server-side operations.
 * It supports both service account file and environment variable configurations.
 */

import admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import path from 'path';
import fs from 'fs';

/**
 * Initialize Firebase Admin SDK
 * Attempts to use service account file first, falls back to environment variables
 */
const initializeFirebase = (): admin.app.App => {
  // Check if already initialized
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  let credential: admin.credential.Credential;

  // Try to load from service account file
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  
  if (serviceAccountPath) {
    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
    
    if (fs.existsSync(absolutePath)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(absolutePath, 'utf8')
      ) as ServiceAccount;
      
      credential = admin.credential.cert(serviceAccount);
      console.log('✓ Firebase initialized with service account file');
    } else {
      throw new Error(`Service account file not found at: ${absolutePath}`);
    }
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    // Use environment variables
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
    console.log('✓ Firebase initialized with environment variables');
  } else {
    throw new Error(
      'Firebase credentials not found. Please provide either FIREBASE_SERVICE_ACCOUNT_PATH or individual credential environment variables.'
    );
  }

  return admin.initializeApp({
    credential,
  });
};

// Initialize Firebase
const app = initializeFirebase();

// Export Firestore instance
export const db = admin.firestore();

// Collection references
export const COLLECTIONS = {
  CUSTOMERS: 'customers',
  DELIVERIES: 'deliveries',
  STOCK: 'stock',
  SETTINGS: 'settings',
} as const;

export default app;
