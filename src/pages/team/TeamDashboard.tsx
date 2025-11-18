import TeamLayout from "@/layouts/TeamLayout";
import { Card } from "@/components/ui/card";
import { Users, FileText, Activity, TrendingUp, UserPlus, Trash2, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface TeamMember {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const TeamDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPlans: 0,
    activeUsers: 0,
    visits: 0,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState({ email: '', role: 'support' });

  useEffect(() => {
    loadStats();
    loadTeamMembers();
  }, []);

  const loadStats = async () => {
    try {
      // Get total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total plans
      const { count: planCount } = await supabase
        .from('user_plan_data')
        .select('*', { count: 'exact', head: true });

      // Get visits from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: visitCount } = await supabase
        .from('analytics_visits')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', thirtyDaysAgo.toISOString());

      // Get team member count
      const { count: teamCount } = await supabase
        .from('team_access')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: userCount || 0,
        totalPlans: planCount || 0,
        activeUsers: teamCount || 0,
        visits: visitCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_access')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    try {
      const { error } = await supabase
        .from('team_access')
        .insert([{ email: newMember.email.toLowerCase(), role: newMember.role }]);

      if (error) throw error;

      toast.success('Team member added successfully');
      setAddDialogOpen(false);
      setNewMember({ email: '', role: 'support' });
      loadTeamMembers();
      loadStats();
    } catch (error: any) {
      console.error('Error adding team member:', error);
      toast.error(error.message || 'Failed to add team member');
    }
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from('team_access')
        .update({ role: selectedMember.role })
        .eq('id', selectedMember.id);

      if (error) throw error;

      toast.success('Team member updated successfully');
      setEditDialogOpen(false);
      setSelectedMember(null);
      loadTeamMembers();
    } catch (error: any) {
      console.error('Error updating team member:', error);
      toast.error(error.message || 'Failed to update team member');
    }
  };

  const handleDeleteMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from team access?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('team_access')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Team member removed successfully');
      loadTeamMembers();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting team member:', error);
      toast.error(error.message || 'Failed to remove team member');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'support':
        return 'default';
      case 'readonly':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Debt Plans",
      value: stats.totalPlans,
      icon: FileText,
      color: "text-accent",
    },
    {
      title: "Team Members",
      value: stats.activeUsers,
      icon: Activity,
      color: "text-green-500",
    },
    {
      title: "Visits (30d)",
      value: stats.visits,
      icon: TrendingUp,
      color: "text-blue-500",
    },
  ];

  return (
    <TeamLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the Finityo team portal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </h3>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
              </Card>
            );
          })}
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Team Members</h2>
              <p className="text-sm text-muted-foreground">Manage access and roles</p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Grant team access to a new member. They'll need to register or sign in with this email.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      placeholder="member@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={newMember.role}
                      onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin - Full access</SelectItem>
                        <SelectItem value="support">Support - Manage users & tickets</SelectItem>
                        <SelectItem value="readonly">Readonly - View only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddMember} className="w-full">
                    Add Member
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No team members yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMember(member);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMember(member.id, member.email)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/team/users')}
              className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
            >
              <h3 className="font-medium mb-1">View All Users</h3>
              <p className="text-sm text-muted-foreground">
                Manage user accounts and permissions
              </p>
            </button>
            <button
              onClick={() => navigate('/team/analytics')}
              className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
            >
              <h3 className="font-medium mb-1">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                View detailed analytics and insights
              </p>
            </button>
            <button
              onClick={() => navigate('/team/logs')}
              className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
            >
              <h3 className="font-medium mb-1">System Logs</h3>
              <p className="text-sm text-muted-foreground">
                Review error logs and system events
              </p>
            </button>
          </div>
        </Card>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update the role for {selectedMember?.email}
              </DialogDescription>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={selectedMember.role}
                    onValueChange={(value) =>
                      setSelectedMember({ ...selectedMember, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin - Full access</SelectItem>
                      <SelectItem value="support">Support - Manage users & tickets</SelectItem>
                      <SelectItem value="readonly">Readonly - View only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpdateMember} className="w-full">
                  Update Role
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TeamLayout>
  );
};

export default TeamDashboard;
