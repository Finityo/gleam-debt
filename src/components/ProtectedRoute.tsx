import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, sessionLoaded } = useAuth();

  // Wait for auth state before deciding
  if (!sessionLoaded) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-foreground/70">
        Loading…
      </div>
    );
  }

  // After loading, if still unauthenticated → redirect
  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  return children;
}
