import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Download, AlertCircle, Activity, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";

const MyLogs = () => {
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [plaidApiLogs, setPlaidApiLogs] = useState<any[]>([]);
  const [plaidLinkErrors, setPlaidLinkErrors] = useState<any[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllLogs();
  }, []);

  const loadAllLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [errors, plaidApi, plaidLink, analytics] = await Promise.all([
        supabase.from('error_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('plaid_api_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('plaid_link_errors').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('analytics_events').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1000),
      ]);

      setErrorLogs(errors.data || []);
      setPlaidApiLogs(plaidApi.data || []);
      setPlaidLinkErrors(plaidLink.data || []);
      setAnalyticsEvents(analytics.data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = (data: any[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value || '');
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const LogCard = ({ title, count, icon: Icon, data, filename }: any) => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{count} records</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadJSON(data, filename)}
            disabled={count === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCSV(data, filename)}
            disabled={count === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>
      {count > 0 && (
        <div className="text-xs text-muted-foreground">
          Latest: {new Date(data[0].created_at).toLocaleString()}
        </div>
      )}
    </Card>
  );

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Activity Logs</h1>
          <p className="text-muted-foreground">
            Download your activity and error logs
          </p>
        </div>

        <div className="grid gap-4">
          <LogCard
            title="Error Logs"
            count={errorLogs.length}
            icon={AlertCircle}
            data={errorLogs}
            filename="error-logs"
          />
          <LogCard
            title="Plaid API Logs"
            count={plaidApiLogs.length}
            icon={Activity}
            data={plaidApiLogs}
            filename="plaid-api-logs"
          />
          <LogCard
            title="Plaid Link Errors"
            count={plaidLinkErrors.length}
            icon={LinkIcon}
            data={plaidLinkErrors}
            filename="plaid-link-errors"
          />
          <LogCard
            title="Analytics Events"
            count={analyticsEvents.length}
            icon={Activity}
            data={analyticsEvents}
            filename="analytics-events"
          />
        </div>

        <Card className="p-6 bg-muted/50">
          <h3 className="font-semibold mb-2">About These Logs</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Error logs show backend function errors and exceptions</li>
            <li>• Plaid API logs track all API calls to Plaid services</li>
            <li>• Plaid Link errors capture issues during bank connection flow</li>
            <li>• Analytics events track your application usage and interactions</li>
          </ul>
        </Card>
      </div>
    </PageShell>
  );
};

export default MyLogs;
