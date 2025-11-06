import { Link } from "react-router-dom";

export default function DashboardLive() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Finityo Live Dashboard</h1>
      <p className="text-gray-600 mb-4">Welcome to the live production environment.</p>
      <div className="flex gap-4">
        <Link to="/debts" className="text-blue-600 underline">Debts</Link>
        <Link to="/plan" className="text-blue-600 underline">Debt Plan</Link>
        <Link to="/visualization" className="text-blue-600 underline">Visualization</Link>
      </div>
    </div>
  );
}
