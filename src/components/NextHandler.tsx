import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DemoStore, useDemoMigration } from "@/hooks/useDemoMigration";
import { useAuth } from "@/context/AuthContext";

export function NextHandler() {
  const { user } = useAuth();
  const { Modal, setOpen } = useDemoMigration();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // wait for user availability
    if (!user) return;

    const params = new URLSearchParams(location.search);
    const next = params.get("next");

    if (!next) return;

    // once we detect next param, strip it from the URL so it doesn't loop
    const cleanUrl = location.pathname;
    window.history.replaceState({}, "", cleanUrl);

    // if user has demo data, open migration immediately
    if (DemoStore.hasData()) {
      setOpen(true);
      // Modal logic already redirects after migration
      return;
    }

    // No demo → navigate directly
    navigate(next);
  }, [user, location, navigate, setOpen]);

  return <Modal />;
}
