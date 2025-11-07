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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Manage your account information
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-950/30 via-pink-950/20 to-cyan-950/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 shadow-lg hover:shadow-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-900/40 hover:via-pink-900/30 hover:to-cyan-900/40">
          <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Personal Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-200">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-purple-500/30 rounded-xl p-3 text-sm bg-slate-900/50 backdrop-blur-sm text-purple-50 placeholder:text-purple-300/50 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400/60 transition-all shadow-sm hover:border-purple-400/40 hover:shadow-purple-400/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-200">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-purple-500/30 rounded-xl p-3 text-sm bg-slate-900/50 backdrop-blur-sm text-purple-50 placeholder:text-purple-300/50 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400/60 transition-all shadow-sm hover:border-purple-400/40 hover:shadow-purple-400/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-200">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full border border-slate-700/30 rounded-xl p-3 text-sm bg-slate-800/30 backdrop-blur-sm text-slate-400 cursor-not-allowed shadow-sm"
              />
              <p className="text-xs text-purple-300/60">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-200">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-purple-500/30 rounded-xl p-3 text-sm bg-slate-900/50 backdrop-blur-sm text-purple-50 placeholder:text-purple-300/50 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400/60 transition-all shadow-sm hover:border-purple-400/40 hover:shadow-purple-400/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-200">Address (optional)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-purple-500/30 rounded-xl p-3 text-sm bg-slate-900/50 backdrop-blur-sm text-purple-50 placeholder:text-purple-300/50 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400/60 transition-all shadow-sm hover:border-purple-400/40 hover:shadow-purple-400/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-200">ZIP Code (optional)</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full border border-purple-500/30 rounded-xl p-3 text-sm bg-slate-900/50 backdrop-blur-sm text-purple-50 placeholder:text-purple-300/50 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400/60 transition-all shadow-sm hover:border-purple-400/40 hover:shadow-purple-400/10"
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-950/30 via-cyan-950/20 to-purple-950/30 backdrop-blur-sm border border-pink-500/20 rounded-xl p-6 shadow-lg hover:shadow-pink-500/20 hover:border-pink-400/40 transition-all duration-300 hover:bg-gradient-to-br hover:from-pink-900/40 hover:via-cyan-900/30 hover:to-purple-900/40">
          <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-pink-300 to-cyan-300 bg-clip-text text-transparent">Subscription</h3>
          {subscription.loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
            </div>
          ) : subscription.subscribed ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-cyan-900/20 border border-purple-500/30 hover:border-pink-400/40 hover:bg-gradient-to-r hover:from-purple-800/30 hover:via-pink-800/30 hover:to-cyan-800/30 transition-all duration-300">
                <div>
                  <div className="font-semibold text-purple-100">{subscription.getTierDisplayName()}</div>
                  <div className="text-sm text-pink-300/80">
                    Active until {subscription.formatSubscriptionEnd()}
                  </div>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-emerald-300 border border-emerald-400/40 text-xs font-medium shadow-sm">
                  Active
                </div>
              </div>
              <Btn onClick={subscription.openCustomerPortal} variant="outline" className="w-full border-purple-500/40 bg-slate-900/30 hover:bg-purple-500/10 hover:border-purple-400/60 text-purple-200 hover:text-purple-100 hover:shadow-purple-400/20 transition-all duration-300">
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Subscription
              </Btn>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-pink-300/80 p-4 rounded-lg bg-pink-900/20 border border-pink-500/20">
                No active subscription. Upgrade to unlock premium features!
              </div>
              <Btn onClick={() => navigate('/pricing')} className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:opacity-90 hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-300 text-white">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Plans
              </Btn>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-cyan-950/30 via-purple-950/20 to-pink-950/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300 hover:bg-gradient-to-br hover:from-cyan-900/40 hover:via-purple-900/30 hover:to-pink-900/40">
          <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">Account Role</h3>
          <div className="space-y-2 p-4 rounded-lg bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-cyan-500/30 hover:border-cyan-400/40 hover:bg-gradient-to-r hover:from-cyan-800/30 hover:to-purple-800/30 transition-all duration-300">
            <div className="text-sm text-cyan-300/80">
              Current role: <span className="font-semibold text-cyan-300 capitalize ml-1">{role}</span>
            </div>
            <p className="text-xs text-purple-300/60">
              Contact an administrator to change your role
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pb-8">
          <Btn 
            onClick={handleSave} 
            disabled={saving}
            className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 text-white"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Btn>
          <Btn onClick={handleSignOut} variant="outline" className="border-purple-500/40 bg-slate-900/30 hover:bg-purple-500/10 hover:border-purple-400/60 text-purple-200 hover:text-purple-100 hover:shadow-purple-400/20 transition-all duration-300">
            Sign Out
          </Btn>
        </div>
      </div>
    </AppLayout>
  );
}
