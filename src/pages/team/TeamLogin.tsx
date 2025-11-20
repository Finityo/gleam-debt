import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield } from "lucide-react";

const TeamLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is a password recovery link
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setIsUpdatingPassword(true);
      toast.info("Enter your new password below");
    }

    // Check if there's an invite token in URL
    const inviteToken = searchParams.get('token');
    if (inviteToken) {
      setToken(inviteToken);
      setIsRegisterMode(true);
      toast.info("Complete your registration using the invite link");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Check if user has team access
      const { data: teamData, error: teamError } = await supabase
        .from('team_access')
        .select('role')
        .eq('email', email)
        .single();

      if (teamError || !teamData) {
        await supabase.auth.signOut();
        toast.error("Access denied. You don't have team access.");
        setLoading(false);
        return;
      }

      toast.success("Login successful!");
      navigate('/team/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!token) {
        throw new Error("Registration requires an invite token. Please contact your administrator.");
      }

      // Use secure token-based registration endpoint
      const { data, error } = await supabase.functions.invoke('team-self-register', {
        body: {
          token,
          password,
          first_name: firstName,
          last_name: lastName,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data?.message || "Registration successful! You can now sign in.");
      setIsRegisterMode(false);
      setToken("");
      setPassword("");
      setFirstName("");
      setLastName("");
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/team/login`,
      });

      if (error) throw error;

      toast.success("Password reset email sent! Check your inbox.");
      setResetMode(false);
      setEmail("");
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully! You can now sign in.");
      setIsUpdatingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
      navigate('/team/login');
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Team Portal</h1>
          <p className="text-muted-foreground">
            {isUpdatingPassword
              ? "Set your new password"
              : resetMode 
              ? "Reset your password" 
              : isRegisterMode 
              ? "Register for team access" 
              : "Sign in to access the admin dashboard"}
          </p>
        </div>

        <form onSubmit={isUpdatingPassword ? handleUpdatePassword : resetMode ? handlePasswordReset : isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
          {isUpdatingPassword ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </>
          ) : null}

          {!isUpdatingPassword && !resetMode && isRegisterMode && (
            <>
              {!token && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Team registration requires an invite link. Please contact your administrator.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="invite-token">Invite Token</Label>
                <Input
                  id="invite-token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your invite token"
                  required
                  readOnly={!!searchParams.get('token')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
          {!isUpdatingPassword && !isRegisterMode && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@finityo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {!isUpdatingPassword && !resetMode && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegisterMode ? "Min 10 chars with uppercase, number, special char" : ""}
                required
              />
              {isRegisterMode && (
                <p className="text-xs text-muted-foreground">
                  Password must be at least 10 characters and include uppercase, lowercase, number, and special character
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (isRegisterMode && !token)}
          >
            {loading 
              ? (isUpdatingPassword ? "Updating password..." : resetMode ? "Sending reset email..." : isRegisterMode ? "Completing registration..." : "Signing in...") 
              : (isUpdatingPassword ? "Update Password" : resetMode ? "Send Reset Email" : isRegisterMode ? "Complete Registration" : "Sign In")
            }
          </Button>
        </form>

        {!isUpdatingPassword && (
          <div className="text-center space-y-2">
            {!resetMode && !isRegisterMode && (
              <button
                type="button"
                onClick={() => {
                  setResetMode(true);
                  setPassword("");
                }}
                className="text-sm text-primary hover:underline block w-full"
              >
                Forgot password?
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (resetMode) {
                  setResetMode(false);
                  setEmail("");
                } else {
                  setIsRegisterMode(!isRegisterMode);
                  setEmail("");
                  setPassword("");
                  setFirstName("");
                  setLastName("");
                }
              }}
              className="text-sm text-primary hover:underline"
            >
              {resetMode 
                ? "Back to sign in" 
                : isRegisterMode 
                ? "Already have an account? Sign in" 
                : "Need an account? Register"}
            </button>
            <p className="text-xs text-muted-foreground">Authorized team members only</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TeamLogin;
