import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Calculator,
  Share2,
  Layers,
  BadgeCheck,
  Settings,
  Calendar,
  Menu,
  X,
} from "lucide-react";
import { Button } from "./ui/button";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/demo/debts", label: "Debts", icon: Calculator },
  { to: "/demo/plan", label: "Plan", icon: Calendar },
  { to: "/demo/power-pack", label: "Power Pack", icon: Layers },
  { to: "/scenarios", label: "Scenarios", icon: Layers },
  { to: "/share/history", label: "Shares", icon: Share2 },
  { to: "/dashboard", label: "Dashboard", icon: BadgeCheck },
];

export function NavDrawer() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Drawer */}
      <aside
        className={`
          fixed md:sticky top-0 h-screen border-r bg-card z-40
          transition-all duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${open ? "w-60" : "md:w-16"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-6 border-b">
          <div className={`font-bold text-xl transition-opacity ${open ? "opacity-100" : "md:opacity-0"}`}>
            Finityo
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setOpen(!open)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg
                  text-sm transition-all duration-200
                  ${active 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
                onClick={() => {
                  // Close mobile menu on navigation
                  if (window.innerWidth < 768) setOpen(false);
                }}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className={`transition-opacity ${open ? "opacity-100" : "md:opacity-0 md:w-0"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
