import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function NextHandler() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(location.search);
    const next = params.get("next");

    if (!next) return;

    // Strip next param from URL to prevent loops
    const cleanUrl = location.pathname;
    window.history.replaceState({}, "", cleanUrl);

    // Navigate to the next destination
    navigate(next);
  }, [user, location, navigate]);

  return null;
}
