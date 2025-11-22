import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Military-mode ProtectedRoute
 * - Blocks render until auth is resolved
 * - Never leaks protected UI during load
 * - Redirects with returnTo for clean UX
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Hard block during auth resolution to prevent UI flash / data leak
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-gray-500 dark:text-gray-300">
        Loading...
      </div>
    );
  }

  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/signin?returnTo=${returnTo}`} replace />;
  }

  return <>{children}</>;
}
