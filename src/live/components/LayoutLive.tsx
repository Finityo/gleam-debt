import { Link } from "react-router-dom";

export function LayoutLive({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <nav className="flex gap-6 items-center justify-center py-4 bg-emerald-700/40 backdrop-blur-xl shadow-md text-sm font-semibold tracking-wide">
        <Link to="/dashboard" className="hover:text-emerald-300 transition-colors">
          Dashboard
        </Link>
        <Link to="/debts" className="hover:text-emerald-300 transition-colors">
          Debts
        </Link>
        <Link to="/plan" className="hover:text-emerald-300 transition-colors">
          Plan
        </Link>
        <Link to="/visualization" className="hover:text-emerald-300 transition-colors">
          Visualization
        </Link>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
