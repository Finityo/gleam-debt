import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

/**
 * Custom hook for smart navigation that considers authentication state
 * - Authenticated users are directed to /dashboard
 * - Unauthenticated users are directed to / (hero page)
 */
export const useSmartNavigation = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Navigate to the appropriate home page based on auth status
   */
  const goToHome = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  /**
   * Navigate back, but ensure we go to the right home page
   */
  const goBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      // Try to go back, but set up a fallback
      const timeout = setTimeout(() => {
        goToHome();
      }, 100);
      
      window.history.back();
      
      // Clear timeout if navigation happens
      window.addEventListener('popstate', () => {
        clearTimeout(timeout);
      }, { once: true });
    } else {
      // No history, go to home
      goToHome();
    }
  };

  return {
    goToHome,
    goBack,
    isAuthenticated,
    navigate
  };
};
