// Initialize Admin User
// This script adds the initial admin user to the admins collection
// Run this once to set up the admin user

import { addAdmin } from '@/components/ui/firebase';

// Admin user details
const ADMIN_EMAIL = 'shyammohapatra@mac.com';
const ADMIN_NAME = 'Shyamalendu Mohapatra';

/**
 * Initialize the admin user in Firestore
 * This function should be called once to set up the initial admin
 * 
 * To use this:
 * 1. Sign in with the admin Google account (shyammohapatra@mac.com)
 * 2. Open browser console
 * 3. Run: window.initializeAdmin()
 */
export async function initializeAdmin(userId: string) {
  try {
    console.log('🔧 Initializing admin user...');
    console.log('📧 Admin email:', ADMIN_EMAIL);
    console.log('👤 Admin name:', ADMIN_NAME);
    console.log('🆔 User ID:', userId);
    
    await addAdmin(userId, ADMIN_EMAIL, ADMIN_NAME);
    
    console.log('✅ Admin user initialized successfully!');
    console.log('🎉 You can now access admin features');
    
    return { success: true, message: 'Admin initialized successfully' };
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    return { success: false, error };
  }
}

// Make function available in browser console for development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).initializeAdmin = initializeAdmin;
}
