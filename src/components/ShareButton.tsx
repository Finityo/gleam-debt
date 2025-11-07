import { useState } from "react";
import { shareSnapshot } from "@/live/api/share";
import { getBadges } from "@/lib/badges";
import { DebtPlan, Debt, UserSettings } from "@/lib/computeDebtPlan";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Share2, Check, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

type Props = {
  plan: DebtPlan;
  debts: Debt[];
  settings: UserSettings;
  notes: string;
};

export default function ShareButton({ plan, debts, settings, notes }: Props) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const handleShareClick = () => {
    setShowPrivacyDialog(true);
    setConsentChecked(false);
  };

  const proceedWithShare = async () => {
    if (!consentChecked) {
      toast.error("Please acknowledge the privacy notice to continue");
      return;
    }

    try {
      setLoading(true);
      setShowPrivacyDialog(false);

      const badges = getBadges(plan);
      const snapshot = { debts, settings, plan, notes, badges };
      const { id } = await shareSnapshot(snapshot);

      const link = `${window.location.origin}/p/${id}`;
      setUrl(link);

      await navigator.clipboard.writeText(link);
      
      toast.success("Share link created and copied to clipboard!", {
        description: "Link expires in 90 days",
      });
    } catch (error) {
      toast.error("Failed to create share link", {
        description: "Please try again or check your connection",
      });
    } finally {
      setLoading(false);
    }
  };

  // Count sensitive items for preview
  const debtCount = debts?.length || 0;
  const totalBalance = debts?.reduce((sum, d) => sum + (d.balance || 0), 0) || 0;
  const hasNotes = notes && notes.trim().length > 0;

  return (
    <>
      <div className="space-y-2">
        <Button
          onClick={handleShareClick}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            "Creating link..."
          ) : url ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Link copied!
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4 mr-2" />
              Share Plan
            </>
          )}
        </Button>

        {url && (
          <div className="text-xs space-y-1">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all block"
            >
              {url}
            </a>
            <p className="text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Expires in 90 days
            </p>
          </div>
        )}
      </div>

      <AlertDialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Share Your Financial Information
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Privacy Notice</AlertTitle>
                  <AlertDescription>
                    You are about to create a <strong>public link</strong> that will expose your financial information to anyone who has the link.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <p className="font-semibold text-foreground">What will be shared:</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span><strong className="text-foreground">{debtCount} debt(s)</strong> including creditor names, exact balances (${totalBalance.toLocaleString()}), interest rates, and minimum payments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span><strong className="text-foreground">Complete payment schedule</strong> showing your debt payoff strategy and timeline</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span><strong className="text-foreground">Your settings</strong> including payoff method and extra payment amounts</span>
                    </li>
                    {hasNotes && (
                      <li className="flex items-start gap-2">
                        <span className="text-destructive">•</span>
                        <span><strong className="text-foreground">Your personal notes</strong> - please ensure they don't contain sensitive information like account numbers</span>
                      </li>
                    )}
                  </ul>
                </div>

                <Alert variant="default">
                  <AlertDescription className="text-sm">
                    <strong>Important:</strong> Anyone with this link can view your financial information. The link will expire automatically after 90 days, but any data viewed before expiration cannot be recalled.
                  </AlertDescription>
                </Alert>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox 
                    id="privacy-consent" 
                    checked={consentChecked}
                    onCheckedChange={(checked) => setConsentChecked(checked === true)}
                  />
                  <Label 
                    htmlFor="privacy-consent" 
                    className="text-sm font-normal cursor-pointer leading-tight text-muted-foreground"
                  >
                    I understand that this will create a public link containing my financial information, and anyone with the link can view this data until it expires in 90 days.
                  </Label>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={proceedWithShare}
              disabled={!consentChecked}
            >
              Create Public Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
