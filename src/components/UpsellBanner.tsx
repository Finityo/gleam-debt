import { Btn } from "@/components/Btn";
import { useUpgrade } from "@/hooks/useUpgrade";

export function UpsellBanner() {
  const { upgrade, loading } = useUpgrade();

  return (
    <div className="rounded-xl bg-card border border-border p-5 text-center space-y-3 shadow-glass mt-10">
      <h3 className="text-xl font-bold text-finityo-textMain">
        Unlock Ultimate
      </h3>
      <p className="text-sm text-finityo-textBody max-w-md mx-auto">
        Sync your bank accounts securely with Plaid, unlock Coach Mode, Notes,
        and full payoff history. Save time. Stay organized.
      </p>

      <Btn 
        variant="cta" 
        className="w-full h-12" 
        onClick={() => upgrade("ultimate")}
        disabled={loading}
      >
        {loading ? "Loading..." : "Upgrade — $4.99/mo"}
      </Btn>
    </div>
  );
}
