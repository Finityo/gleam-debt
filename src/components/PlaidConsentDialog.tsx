import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, ExternalLink, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlaidConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: () => void;
}

export const PlaidConsentDialog = ({
  open,
  onOpenChange,
  onConsent,
}: PlaidConsentDialogProps) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedReadOnly, setAcceptedReadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleContinue = async () => {
    if (!acceptedTerms || !acceptedReadOnly) {
      toast({
        title: "Consent Required",
        description: "Please check both boxes to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Log consent to database
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase.from("plaid_consent_log").insert({
          user_id: user.id,
          accepted_terms: true,
          accepted_privacy: true,
          plaid_privacy_version: "2025-01",
          finityo_terms_version: "2025-01",
          user_agent: navigator.userAgent,
        });

        if (error) {
          console.error("Error logging consent:", error);
          // Continue even if logging fails - don't block user
        }
      }

      // Close dialog and proceed
      onConsent();
      onOpenChange(false);
      
      // Reset state for next time
      setAcceptedTerms(false);
      setAcceptedReadOnly(false);
    } catch (error) {
      console.error("Error in consent flow:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="w-6 h-6 text-primary" />
            Connect Your Financial Account
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Before connecting, please review and accept the following
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* What We Access */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">What Data We Access</h3>
            <p className="text-sm text-muted-foreground">
              When you connect your bank account through Plaid, we will access:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Account details (name, type, account number)</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Current and available balances</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Transaction history</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Credit card and loan details (balances, APRs, due dates)</span>
              </li>
            </ul>
          </div>

          {/* Read-Only Notice */}
          <div className="bg-muted p-4 rounded-lg border border-border">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Read-Only Access</h4>
                <p className="text-sm text-muted-foreground">
                  We can <strong>only view</strong> your financial data. We <strong>cannot</strong> move money, 
                  make payments, or initiate any transactions from your accounts.
                </p>
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">How We Use This Data</h3>
            <p className="text-sm text-muted-foreground">
              Your financial data is used exclusively to:
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Track your debts across all accounts</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Calculate personalized debt payoff plans</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Visualize your progress toward becoming debt-free</span>
              </li>
            </ul>
          </div>

          {/* Plaid Information */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-lg">About Plaid</h3>
            <p className="text-sm text-muted-foreground">
              Plaid is a trusted third-party service that securely connects your financial accounts. 
              Plaid uses bank-level encryption and is used by thousands of financial apps.
            </p>
            <div className="space-y-2">
              <a
                href="https://plaid.com/legal/#end-user-privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Plaid End User Privacy Policy
              </a>
              <a
                href="https://plaid.com/legal/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Plaid End User Services Agreement
              </a>
            </div>
          </div>

          {/* Finityo Policies */}
          <div className="space-y-2">
            <div className="space-y-2">
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Finityo Privacy Policy
              </a>
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Finityo Terms of Service
              </a>
              <a
                href="/disclosures"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Finityo Disclosures
              </a>
            </div>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              />
              <Label
                htmlFor="terms"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                I authorize <strong>Finityo</strong> and <strong>Plaid</strong> to access my financial data 
                as described above. I have reviewed and accept Plaid's Privacy Policy, Plaid's End User 
                Services Agreement, Finityo's Privacy Policy, and Finityo's Terms of Service.
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="readonly"
                checked={acceptedReadOnly}
                onCheckedChange={(checked) => setAcceptedReadOnly(checked as boolean)}
              />
              <Label
                htmlFor="readonly"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                I understand this is <strong>read-only access</strong> and that Finityo and Plaid 
                cannot move money, make payments, or initiate transactions from my accounts.
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!acceptedTerms || !acceptedReadOnly || loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Processing..." : "Continue to Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
