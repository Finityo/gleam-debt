/**
 * Secure logging utility that prevents sensitive information leakage in production
 */

interface ErrorLog {
  message: string;
  timestamp: string;
  context?: string;
}

/**
 * Sanitizes error objects to remove stack traces and sensitive details
 */
function sanitizeError(error: any): ErrorLog {
  return {
    message: error?.message || 'An error occurred',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Logs errors safely - detailed in development, sanitized in production
 */
export function logError(context: string, error: any): void {
  if (import.meta.env.DEV) {
    // Development: show full details
    console.error(`[${context}]`, error);
  } else {
    // Production: sanitize and log minimal info
    const sanitized = sanitizeError(error);
    console.error(`[${context}]`, sanitized.message);
    
    // TODO: In production, send to server-side logging service
    // sendToLoggingService({ ...sanitized, context });
  }
}

/**
 * Logs warnings safely
 */
export function logWarning(context: string, message: string): void {
  if (import.meta.env.DEV) {
    console.warn(`[${context}]`, message);
  } else {
    console.warn(`[${context}]`, message);
  }
}

/**
 * Logs info messages (development only)
 */
export function logInfo(context: string, message: string, data?: any): void {
  if (import.meta.env.DEV) {
    console.log(`[${context}]`, message, data || '');
  }
}
