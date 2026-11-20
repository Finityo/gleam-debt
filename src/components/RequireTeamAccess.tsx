import { Navigate, Outlet, useOutletContext } from "react-router-dom";
import { useTeamAccess, type TeamRole } from "@/hooks/useTeamAccess";

export function RequireTeamAccess() {
  const { role, loading } = useTeamAccess();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/team/login" replace />;
  }

  return <Outlet context={role} />;
}

export function RequireTeamAdmin() {
  const role = useOutletContext<TeamRole>();
  return role === "admin" ? <Outlet context={role} /> : <Navigate to="/team/dashboard" replace />;
}
