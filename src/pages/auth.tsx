import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';
import { PasswordStrengthIndicator, validatePasswordStrength } from '@/components/PasswordStrengthIndicator';
import { DEMO } from '@/config/demo';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  // 🚀 Early return for demo mode
  const navigate = useNavigate();
  
  useEffect(() => {
    if (DEMO) {
      navigate("/dashboard?demo=true");
    }
  }, [navigate]);
  
  if (DEMO) return null; // render nothing while redirecting
  
  // Check URL parameter for default mode
  const params = new URLSearchParams(window.location.search);
  const urlMode = params.get('mode');
  
  const [currentTab, setCurrentTab] = useState(urlMode === 'signin' ? 'signin' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  // Additional signup fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const {
    toast
  } = useToast();
  
  useEffect(() => {
    // Check if user is coming from password reset link
    const params = new URLSearchParams(window.location.search);
    const isPasswordReset = params.get('reset') === 'true';
    
    if (isPasswordReset) {
      setShowResetPassword(true);
    }

    // Redirect if already logged in
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session && !isPasswordReset) {
        navigate('/dashboard');
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowResetPassword(true);
      } else if (session && !showResetPassword) {
        navigate('/dashboard');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, showResetPassword]);
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check terms agreement
    if (!agreedToTerms) {
      toast({
        title: 'Agreement Required',
        description: 'Please agree to the Terms of Service and Privacy Policy to continue.',
        variant: 'destructive'
      });
      return;
    }

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

    // Validate password strength
    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.isValid) {
      toast({
        title: 'Weak Password',
        description: strengthCheck.message,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: firstName,
            last_name: lastName,
            address,
            zip_code: zipCode,
            phone
          }
        }
      });
      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'Account exists',
            description: 'This email is already registered. Please sign in instead.',
            variant: 'destructive'
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Success!',
          description: 'Account created! You can now sign in.'
        });
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setAddress('');
        setZipCode('');
        setPhone('');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

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
      const {
        error
      } = await supabase.auth.signInWithPassword({
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    try {
      emailSchema.parse(resetEmail);
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
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`
      });

      if (error) throw error;

      toast({
        title: 'Check your email',
        description: 'Password reset link has been sent to your email'
      });
      setShowForgotPassword(false);
      setResetEmail('');
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    try {
      passwordSchema.parse(newPassword);
    } catch (error: any) {
      toast({
        title: 'Validation Error',
        description: error.errors?.[0]?.message || 'Invalid password',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Password has been reset successfully'
      });
      setShowResetPassword(false);
      setNewPassword('');
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Debt Manager</CardTitle>
          <CardDescription>Connect your accounts and start crushing debt</CardDescription>
        </CardHeader>
        <CardContent>
          {
            showResetPassword ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Reset Your Password</h3>
                  <p className="text-sm text-muted-foreground">Enter your new password below</p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      placeholder="Enter new password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      required 
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 6 characters
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </form>
              </div>
            ) : showForgotPassword ? (
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowForgotPassword(false)}
                  className="mb-2"
                >
                  ← Back to Sign In
                </Button>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input 
                      id="reset-email" 
                      type="email" 
                      placeholder="you@example.com" 
                      value={resetEmail} 
                      onChange={e => setResetEmail(e.target.value)} 
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              </div>
            ) : (
              <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input id="signin-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input id="signin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <Button 
                      type="button" 
                      variant="link" 
                      className="px-0 text-sm" 
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </Button>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input id="first-name" type="text" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input id="last-name" type="text" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <Input id="signup-phone" type="tel" placeholder="+1234567890" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" type="text" placeholder="123 Main St" value={address} onChange={e => setAddress(e.target.value)} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zip-code">Zip Code</Label>
                    <Input id="zip-code" type="text" placeholder="12345" value={zipCode} onChange={e => setZipCode(e.target.value)} maxLength={10} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={12} />
                    <PasswordStrengthIndicator password={password} />
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="terms" 
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm leading-tight text-muted-foreground cursor-pointer"
                      >
                        I agree to the{' '}
                        <a href="/privacy" target="_blank" className="text-primary hover:underline">
                          Privacy Policy
                        </a>
                        {' '}and consent to Debt Manager connecting to my financial accounts via Plaid to retrieve account data, balances, and transaction information for debt management purposes.
                      </label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || !agreedToTerms}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            )
          }
        </CardContent>
      </Card>
    </div>;
};
export default Auth;