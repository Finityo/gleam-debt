import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface ComplianceItem {
  category: string;
  requirement: string;
  status: 'compliant' | 'warning' | 'info';
  description: string;
}

const complianceItems: ComplianceItem[] = [
  {
    category: 'Link Implementation',
    requirement: 'Link Token Exchange Flow',
    status: 'compliant',
    description: 'Complete implementation of /link/token/create → public_token → access_token exchange'
  },
  {
    category: 'Link Implementation',
    requirement: 'Callback Handlers',
    status: 'compliant',
    description: 'onSuccess, onExit, and onEvent callbacks properly implemented with error handling'
  },
  {
    category: 'Security',
    requirement: 'Secure Token Storage',
    status: 'compliant',
    description: 'Access tokens stored in encrypted vault, never exposed client-side'
  },
  {
    category: 'Security',
    requirement: 'User Consent',
    status: 'compliant',
    description: 'PlaidConsentDialog shown before connecting financial accounts'
  },
  {
    category: 'Logging',
    requirement: 'Identifier Logging',
    status: 'compliant',
    description: 'All key identifiers logged: link_session_id, request_id, account_id, item_id'
  },
  {
    category: 'Error Handling',
    requirement: 'Comprehensive Error Handling',
    status: 'compliant',
    description: 'Link and API errors logged with detailed context for support'
  },
  {
    category: 'Error Handling',
    requirement: 'Update Mode Implementation',
    status: 'compliant',
    description: 'PlaidUpdateBanner handles ITEM_LOGIN_REQUIRED with user notifications'
  },
  {
    category: 'Item Management',
    requirement: 'Item Removal',
    status: 'compliant',
    description: 'Ability to remove individual items and all items for churned users'
  },
  {
    category: 'Item Management',
    requirement: 'Deduplication',
    status: 'compliant',
    description: 'Account-level and institution-level duplicate detection before token exchange'
  },
  {
    category: 'OAuth',
    requirement: 'OAuth Support',
    status: 'compliant',
    description: 'OAuth redirect URI configured with proper relaunch handling'
  },
  {
    category: 'Webhooks',
    requirement: 'Webhook Endpoint',
    status: 'compliant',
    description: 'plaid-webhook edge function handles all webhook types with verification'
  },
  {
    category: 'Rate Limiting',
    requirement: 'Rate Limit Handling',
    status: 'compliant',
    description: 'plaid_rate_limits table tracks attempts with proper user messaging'
  },
  {
    category: 'Analytics',
    requirement: 'Link Conversion Analytics',
    status: 'compliant',
    description: 'PlaidAnalytics component tracks conversion rates and session outcomes'
  },
  {
    category: 'Privacy',
    requirement: 'Privacy Policy',
    status: 'compliant',
    description: 'Plaid privacy policy incorporated into Terms and Privacy pages'
  },
  {
    category: 'Data Protection',
    requirement: 'Encryption at Rest',
    status: 'compliant',
    description: 'All sensitive data encrypted at rest using AES-256 via Supabase'
  },
  {
    category: 'Data Protection',
    requirement: 'Encryption in Transit',
    status: 'compliant',
    description: 'All API requests use TLS 1.2+ for data in transit'
  },
  {
    category: 'Best Practices',
    requirement: 'SDK Usage',
    status: 'compliant',
    description: 'Using official react-plaid-link SDK for Link integration'
  },
  {
    category: 'Best Practices',
    requirement: 'Link Customization',
    status: 'info',
    description: 'Link configuration can be customized via Plaid dashboard'
  },
  {
    category: 'Testing',
    requirement: 'Sandbox Testing',
    status: 'info',
    description: 'Sandbox and Development environments available for testing'
  }
];

export const PlaidComplianceStatus = () => {
  const compliantCount = complianceItems.filter(item => item.status === 'compliant').length;
  const warningCount = complianceItems.filter(item => item.status === 'warning').length;
  const infoCount = complianceItems.filter(item => item.status === 'info').length;
  const totalCount = complianceItems.length;
  const compliancePercentage = Math.round((compliantCount / totalCount) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case 'info':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Compliant</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Warning</Badge>;
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Info</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plaid Implementation Compliance</CardTitle>
        <CardDescription>
          Status of Plaid Integration Handbook requirements
        </CardDescription>
        
        <div className="flex items-center gap-4 pt-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Compliance</span>
              <span className="text-2xl font-bold text-green-600">{compliancePercentage}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-600 transition-all duration-500"
                style={{ width: `${compliancePercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center p-3 rounded-lg border border-green-200 bg-green-50">
            <div className="text-2xl font-bold text-green-700">{compliantCount}</div>
            <div className="text-xs text-green-600">Compliant</div>
          </div>
          {warningCount > 0 && (
            <div className="text-center p-3 rounded-lg border border-amber-200 bg-amber-50">
              <div className="text-2xl font-bold text-amber-700">{warningCount}</div>
              <div className="text-xs text-amber-600">Warnings</div>
            </div>
          )}
          <div className="text-center p-3 rounded-lg border border-blue-200 bg-blue-50">
            <div className="text-2xl font-bold text-blue-700">{infoCount}</div>
            <div className="text-xs text-blue-600">Info</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {Object.entries(
            complianceItems.reduce((acc, item) => {
              if (!acc[item.category]) acc[item.category] = [];
              acc[item.category].push(item);
              return acc;
            }, {} as Record<string, ComplianceItem[]>)
          ).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold mb-3 text-primary">{category}</h3>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="mt-0.5">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-sm">{item.requirement}</p>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg border border-green-200 bg-green-50">
          <p className="text-sm text-green-800">
            <strong>✓ Implementation Complete:</strong> Finityo is 100% compliant with all critical Plaid Implementation Handbook requirements including secure token storage, comprehensive error handling, webhook support, item management, and privacy requirements.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
