import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID
 */
export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Deep clone an object
 */
export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj ?? null));
}

/**
 * Create a hash/fingerprint of an object for comparison
 */
export function hashState(obj: any): string {
  return JSON.stringify(obj);
}
