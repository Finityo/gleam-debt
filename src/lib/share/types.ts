/**
 * Share system types
 */

export type ShareSnapshot = {
  version: number;
  debts: any[];
  settings: any;
  plan: any;
  badges?: any[];
  notes?: string | null;
  includeNotes?: boolean;
  createdAt: string;
  expiresAt?: string | null;
  requiresPin?: boolean;
  metadata?: {
    privacySettings?: {
      notesExcluded?: boolean;
      debtsAnonymized?: boolean;
    };
  };
};

export type ShareListItem = {
  id: string;
  createdAt: string;
  expiresAt: string | null;
  requiresPin: boolean;
  title: string;
};
