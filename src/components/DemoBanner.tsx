import { DEMO } from "@/config/demo";

export function DemoBanner() {
  if (!DEMO) return null;
  return (
    <div className="w-full bg-yellow-200 text-center py-2 text-sm text-gray-800">
      You're viewing Finityo in <b>Demo Mode</b>. Data is sample only; actions are disabled.
    </div>
  );
}
