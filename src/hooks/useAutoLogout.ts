import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useAutoLogout = () => {
  const navigate = useNavigate();
  const lastActivityTime = useRef(Date.now());
  const inactivityTimer = useRef<NodeJS.Timeout>();
  const visibilityTimer = useRef<NodeJS.Timeout>();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const resetTimer = () => {
    lastActivityTime.current = Date.now();
    
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Handle page visibility changes (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left the page - store the time
        lastActivityTime.current = Date.now();
        
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
        }
      } else {
        // User returned to the page
        const timeAway = Date.now() - lastActivityTime.current;
        
        if (timeAway >= INACTIVITY_TIMEOUT) {
          // User was away for more than 5 minutes
          logout();
        } else {
          // Reset the timer for remaining time
          const remainingTime = INACTIVITY_TIMEOUT - timeAway;
          inactivityTimer.current = setTimeout(() => {
            logout();
          }, remainingTime);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initialize the timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      if (visibilityTimer.current) {
        clearTimeout(visibilityTimer.current);
      }
    };
  }, []);
};
