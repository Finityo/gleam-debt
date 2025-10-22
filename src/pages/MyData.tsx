import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Download, 
  UnplugIcon, 
  Building2, 
  Calendar,
  Database,
  AlertCircle
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
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

interface PlaidItem {
  id: string;
  item_id: string;
  institution_name: string;
  institution_id: string;
  created_at: string;
  updated_at: string;
  accounts: PlaidAccount[];
}

interface PlaidAccount {
  id: string;
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  updated_at: string;
}

interface AccessLog {
  id: string;
  item_id: string;
  created_at: string;
  access_type: string;
  function_name: string;
}

interface ConsentLog {
  id: string;
  consented_at: string;
  plaid_privacy_version: string | null;
  finityo_terms_version: string | null;
}

const MyData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plaidItems, setPlaidItems] = useState<PlaidItem[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [disconnectDialog, setDisconnectDialog] = useState<{ open: boolean; itemId: string | null }>({
    open: false,
    itemId: null,
  });

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    try {
      setLoading(true);

      // Fetch Plaid items
      const { data: items, error: itemsError } = await supabase
        .from("plaid_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (itemsError) throw itemsError;

      // Fetch accounts for each item
      const itemsWithAccounts = await Promise.all(
        (items || []).map(async (item) => {
          const { data: accounts } = await supabase
            .from("plaid_accounts")
            .select("*")
            .eq("plaid_item_id", item.id)
            .order("name");

          return {
            ...item,
            accounts: accounts || [],
          };
        })
      );

      setPlaidItems(itemsWithAccounts);

      // Fetch access logs
      const { data: logs } = await supabase
        .from("plaid_token_access_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      setAccessLogs(logs || []);

      // Fetch consent logs
      const { data: consents } = await supabase
        .from("plaid_consent_log")
        .select("*")
        .order("consented_at", { ascending: false });

      setConsentLogs(consents || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleDisconnect = async () => {
    if (!disconnectDialog.itemId) return;

    try {
      const { error } = await supabase.functions.invoke("plaid-remove-item", {
        body: { item_id: disconnectDialog.itemId },
      });

      if (error) throw error;

      toast({
        title: "Account Disconnected",
        description: "The connection has been removed. Data will be retained for 90 days.",
      });

      // Refresh data
      fetchMyData();
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDisconnectDialog({ open: false, itemId: null });
    }
  };

  const handleExportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const exportData = {
        export_date: new Date().toISOString(),
        user_id: user?.id,
        plaid_connections: plaidItems.map((item) => ({
          institution_name: item.institution_name,
          institution_id: item.institution_id,
          connected_at: item.created_at,
          last_updated: item.updated_at,
          accounts: item.accounts.map((acc) => ({
            name: acc.name,
            type: acc.type,
            subtype: acc.subtype,
            mask: acc.mask,
            last_balance_update: acc.updated_at,
          })),
        })),
        consent_history: consentLogs.map((log) => ({
          consented_at: log.consented_at,
          plaid_privacy_version: log.plaid_privacy_version,
          finityo_terms_version: log.finityo_terms_version,
        })),
        access_log_summary: {
          total_accesses: accessLogs.length,
          last_10_accesses: accessLogs.slice(0, 10).map((log) => ({
            accessed_at: log.created_at,
            access_type: log.access_type,
            function: log.function_name,
          })),
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finityo-my-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: "Your data has been downloaded as a JSON file.",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export Failed",
        description: "Unable to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="My Data | Finityo Debt Payoff"
        description="View and manage your connected financial data and access history."
        canonical="https://finityo-debt.com/my-data"
      />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold">My Data</h1>
              <p className="text-muted-foreground mt-1">
                View and manage your connected financial accounts and data access
              </p>
            </div>
          </div>
          <Button onClick={handleExportData} size="lg">
            <Download className="mr-2 w-4 h-4" />
            Export All Data
          </Button>
        </div>

        {/* Connected Accounts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Connected Financial Accounts
            </CardTitle>
            <CardDescription>
              Financial institutions you've connected via Plaid
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plaidItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No accounts connected yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {plaidItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {item.institution_name || "Unknown Institution"}
                          </h3>
                          <Badge variant="outline">{item.accounts.length} accounts</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Connected: {formatDate(item.created_at)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last sync: {formatDate(item.updated_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpandItem(item.id)}
                        >
                          {expandedItems.has(item.id) ? "Hide" : "Show"} Details
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setDisconnectDialog({ open: true, itemId: item.item_id })
                          }
                        >
                          <UnplugIcon className="w-4 h-4 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    </div>

                    {expandedItems.has(item.id) && item.accounts.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-3">Connected Accounts:</h4>
                        <div className="space-y-2">
                          {item.accounts.map((account) => (
                            <div
                              key={account.id}
                              className="bg-muted p-3 rounded flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium">
                                  {account.official_name || account.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {account.type}
                                  {account.subtype && ` - ${account.subtype}`}
                                  {account.mask && ` (••••${account.mask})`}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Updated: {formatDate(account.updated_at)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Access Log */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Access History
            </CardTitle>
            <CardDescription>
              Recent times your Plaid data was accessed (last 100 entries)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accessLogs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No access history yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {accessLogs.map((log, idx) => (
                  <div key={log.id}>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{log.function_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {log.access_type} access
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                    {idx < accessLogs.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consent History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Consent History
            </CardTitle>
            <CardDescription>
              Record of when you authorized Finityo and Plaid to access your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {consentLogs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No consent records found
              </p>
            ) : (
              <div className="space-y-3">
                {consentLogs.map((log) => (
                  <div key={log.id} className="bg-muted p-4 rounded-lg">
                    <p className="font-medium mb-1">Authorization Granted</p>
                    <p className="text-sm text-muted-foreground">
                      Date: {formatDate(log.consented_at)}
                    </p>
                    {log.plaid_privacy_version && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Plaid Privacy Policy Version: {log.plaid_privacy_version}
                      </p>
                    )}
                    {log.finityo_terms_version && (
                      <p className="text-xs text-muted-foreground">
                        Finityo Terms Version: {log.finityo_terms_version}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Retention Notice */}
        <div className="mt-8 p-6 bg-muted rounded-lg border">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Data Retention Policy
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1 ml-7">
            <li>
              • Active connections: Data is retained while your account is active
            </li>
            <li>
              • After disconnection: Data is retained for 90 days, then permanently deleted
            </li>
            <li>
              • Account deletion: All data is permanently deleted within 30 days
            </li>
            <li>
              • You can request immediate deletion by contacting info@finityo.com
            </li>
          </ul>
        </div>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog
        open={disconnectDialog.open}
        onOpenChange={(open) => setDisconnectDialog({ open, itemId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Financial Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately stop Finityo from accessing new data from this bank.
              Previously retrieved data will be retained for 90 days to allow you to export
              it, then permanently deleted. This action will affect your debt tracking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect}>
              Yes, Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyData;
