import { Link } from "react-router-dom";
import { Calculator, PieChart, Calendar, FileText, Share2, Award, MessageSquare, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardLive() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your Finityo workspace</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <DashboardCard
            title="My Debts"
            description="Add, edit, and manage your debts"
            icon={<Calculator className="w-6 h-6" />}
            href="/debts"
          />
          
          <DashboardCard
            title="Debt Plan"
            description="Configure your payoff strategy"
            icon={<Calendar className="w-6 h-6" />}
            href="/plan"
          />
          
          <DashboardCard
            title="Visualization"
            description="See your progress charts"
            icon={<PieChart className="w-6 h-6" />}
            href="/visualization"
          />
          
          <DashboardCard
            title="Calendar"
            description="View payoff timeline"
            icon={<Calendar className="w-6 h-6" />}
            href="/plan/calendar"
          />
          
          <DashboardCard
            title="Compare Plans"
            description="Snowball vs Avalanche"
            icon={<FileText className="w-6 h-6" />}
            href="/plan/compare"
          />
          
          <DashboardCard
            title="Share Plan"
            description="Export and share your plan"
            icon={<Share2 className="w-6 h-6" />}
            href="/share"
          />
          
          <DashboardCard
            title="Badges"
            description="Track your achievements"
            icon={<Award className="w-6 h-6" />}
            href="/badges"
          />
          
          <DashboardCard
            title="Coach Mode"
            description="Get personalized tips"
            icon={<MessageSquare className="w-6 h-6" />}
            href="/coach"
          />
          
          <DashboardCard
            title="Notes"
            description="Add notes to your plan"
            icon={<FileText className="w-6 h-6" />}
            href="/notes"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
            <CardDescription>Follow these steps to get started with Finityo</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">1</span>
                <span>Add your debts manually or import from your bank using Plaid</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">2</span>
                <span>Configure your debt plan and choose between Snowball or Avalanche strategy</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">3</span>
                <span>Track your progress with visualizations and calendar view</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">4</span>
                <span>Export, share, and get coach tips to stay on track</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardCard({ title, description, icon, href }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link to={href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
            <div className="text-primary">{icon}</div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
