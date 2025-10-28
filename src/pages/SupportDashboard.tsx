import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CustomerProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address: string | null;
  zip_code: string | null;
  created_at: string;
}

interface CustomerData extends CustomerProfile {
  email?: string;
  last_sign_in?: string;
  debts_count: number;
  total_debt: number;
  plaid_accounts_count: number;
  last_activity?: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export default function SupportDashboard() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    
    if (!isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard");
      return;
    }

    fetchCustomers();
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // For each profile, fetch aggregated data
      const customersData = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get debts count and total
          const { data: debts } = await supabase
            .from("debts")
            .select("balance")
            .eq("user_id", profile.user_id);

          const debts_count = debts?.length || 0;
          const total_debt = debts?.reduce((sum, d) => sum + Number(d.balance), 0) || 0;

          // Get plaid accounts count
          const { count: plaid_count } = await supabase
            .from("plaid_accounts")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.user_id);

          // Get last activity from analytics
          const { data: lastEvent } = await supabase
            .from("analytics_events")
            .select("created_at")
            .eq("user_id", profile.user_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...profile,
            debts_count,
            total_debt,
            plaid_accounts_count: plaid_count || 0,
            last_activity: lastEvent?.created_at,
          };
        })
      );

      setCustomers(customersData);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customer data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load tickets");
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setSelectedCustomer(customer || null);
    if (customer) {
      fetchTickets(customer.user_id);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Loading support dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button 
        variant="outline" 
        onClick={() => navigate('/admin')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Admin Dashboard
      </Button>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Support Dashboard</h1>
      </div>

      {/* Customer Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Find Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleCustomerSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- Select a Customer --" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.phone || "No phone"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCustomer && (
        <>
          {/* Customer Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Name:</strong> {selectedCustomer.first_name} {selectedCustomer.last_name}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedCustomer.phone || "—"}
                </div>
                <div>
                  <strong>Address:</strong> {selectedCustomer.address || "—"}
                </div>
                <div>
                  <strong>Zip Code:</strong> {selectedCustomer.zip_code || "—"}
                </div>
                <div>
                  <strong>Created:</strong>{" "}
                  {new Date(selectedCustomer.created_at).toLocaleDateString()}
                </div>
                <div>
                  <strong>Last Activity:</strong>{" "}
                  {selectedCustomer.last_activity
                    ? new Date(selectedCustomer.last_activity).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Usage */}
          <Card>
            <CardHeader>
              <CardTitle>App Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>
                  <strong>Debts entered:</strong> {selectedCustomer.debts_count}
                </li>
                <li>
                  <strong>Total debt:</strong> ${selectedCustomer.total_debt.toFixed(2)}
                </li>
                <li>
                  <strong>Plaid accounts connected:</strong> {selectedCustomer.plaid_accounts_count}
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Ticket History */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket History</CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tickets found for this customer.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell>
                          <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ticket.priority === "high"
                                ? "destructive"
                                : ticket.priority === "medium"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
