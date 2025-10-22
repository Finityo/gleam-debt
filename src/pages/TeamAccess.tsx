import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const TeamAccess = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'user'>('user');
  const [registerLoading, setRegisterLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if already logged in and if admin
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Check if user is admin
        const { data: hasRole } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });
        
        if (hasRole) {
          setIsAdmin(true);
        } else {
          navigate('/admin');
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Check if user is admin
        const { data: hasRole } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });
        
        if (hasRole) {
          setIsAdmin(true);
        } else {
          navigate('/admin');
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error: any) {
      toast({
        title: 'Validation Error',
        description: error.errors?.[0]?.message || 'Invalid input',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Invalid credentials',
            description: 'Email or password is incorrect. Please try again.',
            variant: 'destructive'
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign in',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    try {
      emailSchema.parse(email);
    } catch (error: any) {
      toast({
        title: 'Validation Error',
        description: error.errors?.[0]?.message || 'Invalid email',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/team-access`,
      });

      if (error) throw error;

      toast({
        title: 'Reset email sent',
        description: 'Check your email for a password reset link.',
      });
      setResetMode(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    try {
      emailSchema.parse(newMemberEmail);
      passwordSchema.parse(newMemberPassword);
    } catch (error: any) {
      toast({
        title: 'Validation Error',
        description: error.errors?.[0]?.message || 'Invalid input',
        variant: 'destructive'
      });
      return;
    }

    setRegisterLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('register-team-member', {
        body: {
          email: newMemberEmail,
          password: newMemberPassword,
          role: newMemberRole,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: 'Success',
        description: `Team member ${newMemberEmail} registered successfully`,
      });

      // Reset form
      setNewMemberEmail('');
      setNewMemberPassword('');
      setNewMemberRole('user');
      setShowRegisterDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to register team member',
        variant: 'destructive'
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Team Access Portal</CardTitle>
          <CardDescription>
            {isAdmin 
              ? 'Admin Panel' 
              : resetMode 
                ? 'Reset your password' 
                : 'Sign in to access the admin dashboard'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                You are logged in as an administrator
              </p>
              <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="lg">
                    Register Team Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Register New Team Member</DialogTitle>
                    <DialogDescription>
                      Create a new team member account with admin or user privileges
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRegisterMember} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newEmail">Email</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        placeholder="teammember@example.com"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={newMemberPassword}
                        onChange={(e) => setNewMemberPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={newMemberRole}
                        onValueChange={(value: 'admin' | 'user') => setNewMemberRole(value)}
                      >
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={registerLoading}>
                      {registerLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/admin')}
              >
                Go to Admin Dashboard
              </Button>
            </div>
          ) : resetMode ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => setResetMode(false)}
              >
                Back to Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <Button 
                type="button" 
                variant="link" 
                className="w-full text-sm" 
                onClick={() => setResetMode(true)}
              >
                Forgot password?
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamAccess;
