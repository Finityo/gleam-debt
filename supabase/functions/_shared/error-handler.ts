// ============================================================================
// SECURITY: Centralized Error Handler
// ============================================================================
// Purpose: Prevent information disclosure through error messages
// Security: Logs full errors server-side, returns sanitized messages to clients
// DO NOT DELETE: Critical protection against information leakage
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SECURITY: Safe error messages for clients (no internal details)
enum ErrorType {
  AUTH_ERROR = 'Authentication failed',
  FORBIDDEN = 'Access denied',
  NOT_FOUND = 'Resource not found',
  VALIDATION_ERROR = 'Invalid input',
  RATE_LIMIT = 'Too many requests',
  SERVER_ERROR = 'An error occurred processing your request'
}

interface ErrorContext {
  functionName: string;
  userId?: string;
  requestPath?: string;
}

/**
 * SECURITY: Handles errors safely without exposing internal details to clients
 * 
 * @param error - The caught error object
 * @param context - Context about where the error occurred
 * @returns Response with safe error message for client
 */
export async function handleError(
  error: any,
  context: ErrorContext
): Promise<Response> {
  
  // SECURITY: Determine safe user-facing message and status code
  let userMessage = ErrorType.SERVER_ERROR;
  let statusCode = 500;
  
  // Categorize error without exposing details
  if (error.message?.toLowerCase().includes('unauthorized') || 
      error.message?.toLowerCase().includes('not authenticated') ||
      error.message?.toLowerCase().includes('invalid token')) {
    userMessage = ErrorType.AUTH_ERROR;
    statusCode = 401;
  } else if (error.message?.toLowerCase().includes('forbidden') || 
             error.message?.toLowerCase().includes('access denied') ||
             error.message?.toLowerCase().includes('permission')) {
    userMessage = ErrorType.FORBIDDEN;
    statusCode = 403;
  } else if (error.message?.toLowerCase().includes('not found')) {
    userMessage = ErrorType.NOT_FOUND;
    statusCode = 404;
  } else if (error.message?.toLowerCase().includes('rate limit')) {
    userMessage = ErrorType.RATE_LIMIT;
    statusCode = 429;
  } else if (error instanceof z.ZodError) {
    userMessage = ErrorType.VALIDATION_ERROR;
    statusCode = 400;
  }
  
  // SECURITY: Log full error details server-side only (never sent to client)
  console.error(`[${context.functionName}] ERROR:`, {
    message: error.message,
    stack: error.stack,
    type: error.constructor?.name,
    userId: context.userId || 'anonymous',
    timestamp: new Date().toISOString(),
    ...(error instanceof z.ZodError && { validationErrors: error.errors })
  });
  
  // SECURITY: Store error in secure audit log (admin-only access)
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    await supabaseAdmin.from('error_logs').insert({
      function_name: context.functionName,
      error_message: error.message?.substring(0, 500) || 'Unknown error',
      error_type: error.constructor?.name || 'Error',
      error_stack: error.stack?.substring(0, 2000) || null,
      user_id: context.userId || null,
      request_path: context.requestPath || null
    });
  } catch (logError) {
    // If logging fails, don't crash - just log to console
    console.error('Failed to log error to database:', logError);
  }
  
  // SECURITY: Return sanitized error to client
  return new Response(
    JSON.stringify({ 
      error: userMessage,
      ...(error instanceof z.ZodError && { 
        details: 'Invalid input data. Please check your request.' 
      })
    }),
    { 
      status: statusCode, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Helper to get user ID from request for error logging
 */
export async function getUserIdFromRequest(req: Request): Promise<string | undefined> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return undefined;
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user?.id;
  } catch {
    return undefined;
  }
}
