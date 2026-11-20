import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { checkAdminAccess } from "@/guards/adminGuard";

export function RequireAdmin() {
  const { user } = useAuth();
  const [access, setAccess] = useState<{ user: typeof user; allowed: boolean }>();

  useEffect(() => {
    if (!user) return;

    let active = true;
    void checkAdminAccess(user.id).then((allowed) => {
      if (active) setAccess({ user, allowed });
    });
    return () => { active = false; };
  }, [user]);

  if (!access || access.user !== user) return <p role="status">Checking access…</p>;

  return access.allowed ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
