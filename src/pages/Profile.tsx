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
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account information
          </p>
        </div>

        <Card title="Personal Information">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-brand-border rounded-base p-2 text-sm bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-brand-border rounded-base p-2 text-sm bg-background text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full border border-brand-border rounded-base p-2 text-sm bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-brand-border rounded-base p-2 text-sm bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address (optional)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-brand-border rounded-base p-2 text-sm bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ZIP Code (optional)</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full border border-brand-border rounded-base p-2 text-sm bg-background text-foreground"
              />
            </div>
          </div>
        </Card>

        <Card title="Subscription">
          {subscription.loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : subscription.subscribed ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">{subscription.getTierDisplayName()}</div>
                  <div className="text-sm text-muted-foreground">
                    Active until {subscription.formatSubscriptionEnd()}
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                  Active
                </div>
              </div>
              <Btn onClick={subscription.openCustomerPortal} variant="outline" className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Subscription
              </Btn>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                No active subscription. Upgrade to unlock premium features!
              </div>
              <Btn onClick={() => navigate('/pricing')} className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Plans
              </Btn>
            </div>
          )}
        </Card>

        <Card title="Account Role">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Current role: <span className="font-medium text-foreground capitalize">{role}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Contact an administrator to change your role
            </p>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Btn>
          <Btn onClick={handleSignOut} variant="outline">
            Sign Out
          </Btn>
        </div>
      </div>
    </AppLayout>
  );
}
