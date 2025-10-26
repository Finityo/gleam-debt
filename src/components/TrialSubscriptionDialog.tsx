import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Crown, Sparkles } from "lucide-react";

export const TrialSubscriptionDialog = () => {
  const [open, setOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkTrialStatus = async () => {
      // Don't check if already checked this session
      if (hasChecked) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user has dismissed this dialog before
        const dismissed = localStorage.getItem('trial-dialog-dismissed');
        if (dismissed) return;

        // Check subscription status
        const { data: subData, error } = await supabase.functions.invoke("check-subscription");
        if (error) throw error;

        // Show dialog if user is not subscribed (trial user)
        if (!subData?.subscribed) {
          setOpen(true);
        }
        setHasChecked(true);
      } catch (error) {
        console.error("Error checking trial status:", error);
        setHasChecked(true);
      }
    };

    checkTrialStatus();
  }, [hasChecked]);

  const handleViewPlans = () => {
    setOpen(false);
    localStorage.setItem('trial-dialog-dismissed', 'true');
    navigate("/pricing");
  };

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem('trial-dialog-dismissed', 'true');
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Crown className="h-16 w-16 text-accent" />
              <Sparkles className="h-6 w-6 text-accent absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-2xl">
            Welcome to Your 30-Day Trial!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3 pt-2">
            <p className="text-base">
              You're currently enjoying all premium features during your trial period.
            </p>
            <p className="text-sm text-muted-foreground">
              To continue using Finityo after your trial ends, select a plan that works for you.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-foreground">
                ✓ Connect unlimited accounts
                <br />
                ✓ Track all your debts
                <br />
                ✓ AI-powered debt strategies
                <br />
                ✓ Export your plan to Excel
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleDismiss}>
            Maybe Later
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleViewPlans} className="bg-accent hover:bg-accent/90">
            View Pricing Plans
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
