import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserX, UserCheck, AlertTriangle, ArrowLeft } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { logError } from '@/utils/logger';
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
import { Badge } from '@/components/ui/badge';

interface UserWithRole {
  user_id: string;
  email: string;
  role: 'admin' | 'user' | 'support';
  created_at: string;
}

const UserRoleManagement = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [actionType, setActionType] = useState<'promote' | 'demote' | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccessAndFetchUsers();
  }, []);

  const checkAdminAccessAndFetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user has admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (!roles) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive',
        });
        navigate('/admin');
        return;
      }

      setIsAdmin(true);
      await fetchUsers();
    } catch (error) {
      logError('User Role Management - Access Check', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch all users with their roles
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails from auth.users using the admin function
      const usersWithEmails = await Promise.all(
        (userRoles || []).map(async (userRole) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('user_id', userRole.user_id)
            .single();

          // Get email from session or use placeholder
          return {
            user_id: userRole.user_id,
            email: `user-${userRole.user_id.slice(0, 8)}@finityo.com`, // Placeholder since we can't access auth.users
            role: userRole.role as 'admin' | 'user' | 'support',
            created_at: userRole.created_at,
          };
        })
      );

      setUsers(usersWithEmails);
    } catch (error) {
      logError('User Role Management - Fetch Users', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user' | 'support') => {
    try {
      // Note: Since we can't update user_roles from client (no UPDATE policy),
      // this is for demonstration. In production, create an edge function for this.
      toast({
        title: 'Not Implemented',
        description: 'Role changes require a backend edge function for security. This is a demonstration UI.',
        variant: 'destructive',
      });

      // TODO: Call edge function to update role
      // const { error } = await supabase.functions.invoke('update-user-role', {
      //   body: { userId, newRole }
      // });

      setSelectedUser(null);
      setActionType(null);
    } catch (error) {
      logError('User Role Management - Role Change', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'support':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <SEOHead
        title="User Role Management | Finityo Admin"
        description="Manage user roles and permissions for Finityo platform"
        canonical="https://finityo-debt.com/admin/roles"
      />
      <div className="min-h-screen bg-gradient-subtle">
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6" />
                User Role Management
              </h1>
              <p className="text-sm text-muted-foreground">Manage user permissions and access levels</p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Warning Banner */}
          <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Security Note</h3>
                  <p className="text-sm text-muted-foreground">
                    Role management is currently read-only from the UI for security reasons. 
                    To change user roles, create a secure edge function with proper authentication 
                    and audit logging. Never update roles directly from the client.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">All registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </div>
                <p className="text-xs text-muted-foreground">Full system access</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Support Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'support').length}
                </div>
                <p className="text-xs text-muted-foreground">Customer support access</p>
              </CardContent>
            </Card>
          </div>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>All Users & Roles</CardTitle>
              <CardDescription>View user roles and access levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No users found</p>
                ) : (
                  users.map((user) => (
                    <div 
                      key={user.user_id} 
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="font-medium">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              User ID: {user.user_id.slice(0, 8)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Registered: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {user.role !== 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('promote');
                            }}
                            disabled
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Promote
                          </Button>
                        )}
                        {user.role === 'admin' && users.filter(u => u.role === 'admin').length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('demote');
                            }}
                            disabled
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Demote
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Implementation Guide */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Implementation Guide</CardTitle>
              <CardDescription>How to implement secure role management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">1. Create Edge Function</h4>
                  <code className="block bg-muted p-3 rounded text-xs overflow-x-auto">
                    {`// supabase/functions/update-user-role/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  // Authenticate request
  const authClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )
  
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  
  // Check if user is admin
  const { data: roles } = await authClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()
  
  if (!roles) return new Response('Forbidden', { status: 403 })
  
  // Use service role to update
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const { userId, newRole } = await req.json()
  
  // Update role
  const { error } = await adminClient
    .from('user_roles')
    .update({ role: newRole })
    .eq('user_id', userId)
  
  if (error) return new Response(JSON.stringify({ error }), { status: 500 })
  
  // Log the change
  await adminClient
    .from('security_audit_log')
    .insert({
      check_type: 'role_change',
      severity: 'info',
      description: \`Admin \${user.id} changed role for user \${userId} to \${newRole}\`,
      metadata: { admin_id: user.id, target_user_id: userId, new_role: newRole }
    })
  
  return new Response(JSON.stringify({ success: true }), { status: 200 })
})`}
                  </code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">2. Add UPDATE Policy</h4>
                  <code className="block bg-muted p-3 rounded text-xs">
                    {`-- Migration: Add UPDATE policy for service role only
-- This allows the edge function to update roles
-- Regular users still cannot update roles from client`}
                  </code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">3. Enable UI</h4>
                  <p className="text-muted-foreground">
                    Once the edge function is deployed, remove the 'disabled' prop from the buttons above
                    and uncomment the edge function call in handleRoleChange().
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={selectedUser !== null} onOpenChange={() => {
        setSelectedUser(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'promote' ? 'Promote User' : 'Demote User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'promote' 
                ? `Grant admin privileges to ${selectedUser?.email}? This will give them full system access.`
                : `Remove admin privileges from ${selectedUser?.email}? They will become a regular user.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && handleRoleChange(
                selectedUser.user_id, 
                actionType === 'promote' ? 'admin' : 'user'
              )}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserRoleManagement;
