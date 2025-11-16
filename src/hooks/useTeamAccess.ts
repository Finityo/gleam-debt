import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type TeamRole = 'admin' | 'support' | 'readonly';

interface TeamAccess {
  hasAccess: boolean;
  role: TeamRole | null;
  loading: boolean;
}

export const useTeamAccess = (requiredRole?: TeamRole): TeamAccess => {
  const [hasAccess, setHasAccess] = useState(false);
  const [role, setRole] = useState<TeamRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        setHasAccess(false);
        setLoading(false);
        navigate('/team/login');
        return;
      }

      const { data, error } = await supabase
        .from('team_access')
        .select('role')
        .eq('email', user.email)
        .single();

      if (error || !data) {
        setHasAccess(false);
        setRole(null);
        setLoading(false);
        navigate('/team/login');
        return;
      }

      const userRole = data.role as TeamRole;
      setRole(userRole);

      // Check if user has required role
      if (requiredRole) {
        const hasRequiredRole = userRole === requiredRole || userRole === 'admin';
        setHasAccess(hasRequiredRole);
        
        if (!hasRequiredRole) {
          navigate('/team/dashboard');
        }
      } else {
        setHasAccess(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking team access:', error);
      setHasAccess(false);
      setLoading(false);
      navigate('/team/login');
    }
  };

  return { hasAccess, role, loading };
};
