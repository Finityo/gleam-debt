import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Btn } from "@/components/Btn";
import { Card } from "@/components/Card";
import AppLayout from "@/layouts/AppLayout";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { ExternalLink, CreditCard } from "lucide-react";

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const subscription = useSubscription();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [role, setRole] = useState<"user" | "coach" | "admin">("user");

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  async function loadProfile() {
    if (!user) return;

    try {
      // Load profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setPhone(profile.phone || "");
        setAddress(profile.address || "");
        setZipCode(profile.zip_code || "");
      }

      // Load role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError) throw roleError;

      if (roleData) {
        setRole(roleData.role as any);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          address: address || null,
          zip_code: zipCode || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/");
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Manage your account information
          </p>
        </div>

        <div className="bg-gradient-to-br from-card/40 via-card/60 to-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Personal Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/90">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-primary/20 rounded-xl p-3 text-sm bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/90">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-primary/20 rounded-xl p-3 text-sm bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/90">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full border border-border/20 rounded-xl p-3 text-sm bg-muted/20 backdrop-blur-sm text-muted-foreground cursor-not-allowed shadow-sm"
              />
              <p className="text-xs text-muted-foreground/70">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/90">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-primary/20 rounded-xl p-3 text-sm bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/90">Address (optional)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-primary/20 rounded-xl p-3 text-sm bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/90">ZIP Code (optional)</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full border border-primary/20 rounded-xl p-3 text-sm bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-card/40 via-card/60 to-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Subscription</h3>
          {subscription.loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : subscription.subscribed ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 border border-primary/20">
                <div>
                  <div className="font-semibold text-foreground">{subscription.getTierDisplayName()}</div>
                  <div className="text-sm text-muted-foreground">
                    Active until {subscription.formatSubscriptionEnd()}
                  </div>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium shadow-sm">
                  Active
                </div>
              </div>
              <Btn onClick={subscription.openCustomerPortal} variant="outline" className="w-full border-primary/30 bg-background/30 hover:bg-primary/10 hover:border-primary/50">
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Subscription
              </Btn>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground p-4 rounded-lg bg-muted/10 border border-border/20">
                No active subscription. Upgrade to unlock premium features!
              </div>
              <Btn onClick={() => navigate('/pricing')} className="w-full bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-90 shadow-lg">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Plans
              </Btn>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-card/40 via-card/60 to-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Account Role</h3>
          <div className="space-y-2 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
            <div className="text-sm text-muted-foreground">
              Current role: <span className="font-semibold text-primary capitalize ml-1">{role}</span>
            </div>
            <p className="text-xs text-muted-foreground/70">
              Contact an administrator to change your role
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pb-8">
          <Btn 
            onClick={handleSave} 
            disabled={saving}
            className="bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-90 shadow-lg"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Btn>
          <Btn onClick={handleSignOut} variant="outline" className="border-border/50 bg-background/30 hover:bg-accent/10 shadow-sm">
            Sign Out
          </Btn>
        </div>
      </div>
    </AppLayout>
  );
}
