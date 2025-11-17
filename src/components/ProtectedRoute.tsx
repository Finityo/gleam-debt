import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Prevent false redirects during initial auth load
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  // After loading completes, only redirect if user is truly missing
  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  return <>{children}</>;
}
