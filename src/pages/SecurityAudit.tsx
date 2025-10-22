import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";
import { toast } from "sonner";

interface SecurityAuditLog {
  id: string;
  check_type: string;
  severity: 'info' | 'warn' | 'error' | 'critical';
  description: string;
  metadata?: any;
  auto_fixed: boolean;
  created_at: string;
}

export default function SecurityAudit() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAndFetchLogs();
  }, []);

  const checkAdminAndFetchLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user has admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roles) {
        toast.error('Access denied: Admin privileges required');
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await fetchLogs();
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/dashboard');
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setLogs((data as SecurityAuditLog[]) || []);
    } catch (error) {
      console.error('Error fetching security logs:', error);
      toast.error('Failed to load security audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warn': return 'default';
      case 'info': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warn': return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'info': return <Info className="h-5 w-5 text-info" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Audit Log</h1>
          <p className="text-muted-foreground mt-2">
            Automated security checks run daily at 2:00 AM UTC
          </p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This page displays findings from the automated security correction task. 
          Critical and error-level issues require immediate attention.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-success mb-4" />
            <p className="text-lg font-medium">No security issues found</p>
            <p className="text-muted-foreground mt-2">
              All automated security checks passed successfully
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(log.severity)}
                    <div>
                      <CardTitle className="text-lg">
                        {log.check_type.replace(/_/g, ' ').toUpperCase()}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {new Date(log.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getSeverityColor(log.severity)}>
                      {log.severity.toUpperCase()}
                    </Badge>
                    {log.auto_fixed && (
                      <Badge variant="secondary">Auto-fixed</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-foreground">{log.description}</p>
                {log.metadata && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      View metadata
                    </summary>
                    <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
