import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Home,
  Calculator,
  Share2,
  Layers,
  Settings,
  Calendar,
  Menu,
  X,
  Activity,
  User,
  LogIn,
} from "lucide-react";
import { Button } from "./ui/button";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/debts", label: "Debts", icon: Calculator },
  { to: "/debt-plan", label: "Plan", icon: Calendar },
  { to: "/setup/power-pack", label: "Power Pack", icon: Activity },
  { to: "/scenarios", label: "Scenarios", icon: Layers },
  { to: "/share/history", label: "Shares", icon: Share2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function NavDrawer() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50 bg-card/80 backdrop-blur-sm"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Desktop Toggle Button - Always Visible */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex fixed top-4 left-4 z-50 bg-card/80 backdrop-blur-sm"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Drawer */}
      <aside
        className={`
          fixed md:sticky top-0 h-screen border-r border-border/50 bg-card/95 backdrop-blur-sm z-40
          transition-all duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          ${collapsed ? "md:w-0 md:border-r-0" : "w-60"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-6 border-b border-border/50">
          <div className={`font-bold text-xl bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent transition-opacity ${collapsed ? "md:opacity-0" : "opacity-100"}`}>
            Finityo
          </div>
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
                  flex items-center gap-3 px-3 py-2 rounded-lg sidebar-active-bar
                  text-sm transition-all duration-200
                  ${active 
                    ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30 font-medium active" 
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                  }
                `}
                onClick={() => {
                  // Close mobile menu on navigation
                  if (window.innerWidth < 768) setOpen(false);
                }}
              >
                <Icon className="h-5 w-5 flex-shrink-0 icon-hover" />
                <span className={`transition-opacity ${collapsed ? "md:opacity-0 md:w-0 md:hidden" : "opacity-100"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Auth section */}
        <div className="border-t border-border/50 px-3 py-3">
          {user ? (
            <Link
              to="/profile"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                pathname === "/profile"
                  ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30 font-medium"
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              }`}
              onClick={() => {
                if (window.innerWidth < 768) setOpen(false);
              }}
            >
              <User className="h-5 w-5 flex-shrink-0" />
              <span className={`transition-opacity ${collapsed ? "md:opacity-0 md:w-0 md:hidden" : "opacity-100"}`}>
                Profile
              </span>
            </Link>
          ) : (
            <Link
              to="/auth/signin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-all duration-200"
              onClick={() => {
                if (window.innerWidth < 768) setOpen(false);
              }}
            >
              <LogIn className="h-5 w-5 flex-shrink-0" />
              <span className={`transition-opacity ${collapsed ? "md:opacity-0 md:w-0 md:hidden" : "opacity-100"}`}>
                Sign In
              </span>
            </Link>
          )}
        </div>
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
