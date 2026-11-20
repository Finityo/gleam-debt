import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type TeamRole = "admin" | "support" | "readonly";

export function useTeamAccess() {
  const { user, loading: authLoading } = useAuth();
  const { pathname } = useLocation();
  const [access, setAccess] = useState<{ user: typeof user; pathname: string; role: TeamRole | null }>();

  useEffect(() => {
    if (authLoading || !user?.email) return;

    let active = true;

    async function checkAccess() {
      try {
        const { data: { user: verifiedUser }, error: authError } = await supabase.auth.getUser();
        if (authError || verifiedUser?.id !== user.id || verifiedUser.email !== user.email) {
          if (active) setAccess({ user, pathname, role: null });
          return;
        }

        const { data, error } = await supabase
          .from("team_access")
          .select("role")
          .eq("email", verifiedUser.email)
          .single();

        const role = data?.role;
        const allowed = !error && (role === "admin" || role === "support" || role === "readonly");
        if (active) setAccess({ user, pathname, role: allowed ? role : null });
      } catch {
        if (active) setAccess({ user, pathname, role: null });
      }
    }

    void checkAccess();
    return () => { active = false; };
  }, [authLoading, pathname, user]);

  const checked = access?.user === user && access?.pathname === pathname;
  const role = checked ? access.role : null;
  return { role, loading: authLoading || (!!user?.email && !checked) };
}
