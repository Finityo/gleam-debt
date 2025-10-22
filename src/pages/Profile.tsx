import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, User, Mail, Phone, MapPin, CreditCard, Save, Trash2, AlertTriangle } from 'lucide-react';
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
import { Separator } from "@/components/ui/separator";
import { SubscriptionManager } from '@/components/SubscriptionManager';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { SEOHead } from '@/components/SEOHead';

interface Profile {
  first_name: string;
  last_name: string;
  phone: string | null;
  address: string | null;
  zip_code: string | null;
}

const Profile = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      await fetchProfile(session.user.id);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile(data);
      } else {
        // Initialize empty profile
        setProfile({
          first_name: '',
          last_name: '',
          phone: null,
          address: null,
          zip_code: null,
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...profile,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof Profile, value: string) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      toast({
        title: 'Confirmation Required',
        description: 'Please type "DELETE MY ACCOUNT" exactly to confirm.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setDeleting(true);

    try {
      // First, revoke all Plaid connections
      const { data: plaidItems } = await supabase
        .from('plaid_items')
        .select('item_id')
        .eq('user_id', user.id);

      if (plaidItems && plaidItems.length > 0) {
        console.log('Revoking Plaid items...');
        for (const item of plaidItems) {
          try {
            await supabase.functions.invoke('plaid-remove-item', {
              body: { itemId: item.item_id },
            });
          } catch (error) {
            console.error('Error revoking Plaid item:', error);
          }
        }
      }

      // Call the server-side account deletion edge function
      const { data, error } = await supabase.functions.invoke('delete-user-account');

      if (error) {
        console.error('Edge function error:', error);
        throw new Error('Failed to delete account');
      }

      toast({
        title: 'Account Deleted',
        description: 'Your account and all data have been permanently deleted.',
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account. Please contact support.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialog(false);
      setDeleteConfirmText('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="My Profile | Finityo"
        description="Manage your profile and subscription"
      />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-bold text-foreground mb-8">My Profile</h1>

        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile?.first_name || ''}
                    onChange={(e) => updateProfile('first_name', e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile?.last_name || ''}
                    onChange={(e) => updateProfile('last_name', e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile?.phone || ''}
                  onChange={(e) => updateProfile('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </Label>
                <Input
                  id="address"
                  value={profile?.address || ''}
                  onChange={(e) => updateProfile('address', e.target.value)}
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={profile?.zip_code || ''}
                  onChange={(e) => updateProfile('zip_code', e.target.value)}
                  placeholder="12345"
                  maxLength={10}
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription & Billing
              </CardTitle>
              <CardDescription>Manage your subscription and payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionManager />
            </CardContent>
          </Card>

          {/* Danger Zone - Account Deletion */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-destructive">Warning: This action cannot be undone</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Deleting your account will:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Immediately disconnect all Plaid connections</li>
                    <li>• Permanently delete all your financial data within 30 days</li>
                    <li>• Remove all debt records and payment plans</li>
                    <li>• Delete your profile and account settings</li>
                    <li>• Cancel any active subscriptions</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">
                    <strong>Data Retention:</strong> All Plaid-sourced data and personal information 
                    will be permanently deleted within 30 days. Encrypted access tokens will be 
                    immediately revoked from our secure vault.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Before deleting, consider exporting your data from the{' '}
                    <Button
                      variant="link"
                      className="h-auto p-0 text-primary"
                      onClick={() => navigate('/my-data')}
                    >
                      My Data
                    </Button>{' '}
                    page.
                  </p>
                </div>

                <Separator />

                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialog(true)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive text-xl">
              <AlertTriangle className="w-6 h-6" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-base">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently delete your account 
                and remove all your data from our servers.
              </p>
              <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                <p className="font-semibold mb-2">The following will be deleted:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>✗ All Plaid connections (immediate disconnection)</li>
                  <li>✗ All financial account data</li>
                  <li>✗ All debt records and payment plans</li>
                  <li>✗ Your profile and personal information</li>
                  <li>✗ Access logs and consent history</li>
                  <li>✗ Any subscriptions or billing information</li>
                </ul>
              </div>
              <p className="text-sm">
                <strong>Timeline:</strong> Plaid connections will be terminated immediately. 
                All data will be permanently deleted within 30 days.
              </p>
              <div className="pt-4">
                <Label htmlFor="deleteConfirm" className="text-base">
                  To confirm deletion, please type{' '}
                  <span className="font-mono font-bold bg-muted px-2 py-1 rounded">
                    DELETE MY ACCOUNT
                  </span>
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE MY ACCOUNT"
                  className="mt-2"
                  autoComplete="off"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE MY ACCOUNT' || deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Yes, Delete My Account
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
