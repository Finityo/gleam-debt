import { useEffect } from "react";
import { CheckCircle2, Plus, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PlaidSuccessScreenProps {
  accountMask?: string;
  institutionName?: string;
  onConnectAnother: () => void;
  onViewAccounts: () => void;
}

export const PlaidSuccessScreen = ({
  accountMask,
  institutionName,
  onConnectAnother,
  onViewAccounts,
}: PlaidSuccessScreenProps) => {
  // Auto-redirect after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onViewAccounts();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onViewAccounts]);
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <CheckCircle2 className="w-20 h-20 text-primary relative" />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Successfully Connected!</h2>
          <p className="text-muted-foreground">
            Your {institutionName || "bank"} account
            {accountMask && (
              <span className="font-mono"> ending in {accountMask}</span>
            )}
            {" "}has been securely linked.
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <span>Automatic debt tracking across all accounts</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <span>Personalized payoff plans updated daily</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span>Bank-level encryption with read-only access</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={onConnectAnother}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Another Account
          </Button>
          <Button
            onClick={onViewAccounts}
            className="w-full"
            size="lg"
          >
            View All Accounts
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Additional Info */}
        <p className="text-xs text-center text-muted-foreground">
          You can manage or remove connected accounts anytime from your dashboard
        </p>
      </Card>
    </div>
  );
};
