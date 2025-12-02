// src/guards/adminGuard.ts
// HARD ADMIN-ONLY ACCESS ENFORCEMENT FOR DEV TOOLS

import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if the current user has admin role
 * Uses server-side validation via Supabase RLS and has_role function
 */
export async function checkAdminAccess(): Promise<boolean> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    // Check if user has admin role using the database function
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (error) {
      console.error('Admin check error:', error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.error('Admin access check failed:', err);
    return false;
  }
}

/**
 * Throws error if user is not admin
 * Use this for hard-fail enforcement
 */
export async function assertAdminAccess(): Promise<void> {
  const isAdmin = await checkAdminAccess();
  
  if (!isAdmin) {
    throw new Error("ACCESS DENIED: Admin privileges required");
  }
}
