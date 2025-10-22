import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Loader2, ArrowLeft, Shield, Scale, Lock, FileCheck, ClipboardList } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

const documents = [
  {
    id: 'plaid-compliance',
    title: 'Plaid MSA Compliance Report',
    description: 'Complete Plaid MSA compliance documentation with implementation checklist and testing results',
    icon: FileCheck,
    color: 'text-blue-600',
  },
  {
    id: 'security-notes',
    title: 'Security Review & Testing Checklist',
    description: 'Comprehensive security audit results, fixes implemented, and testing checklist',
    icon: Shield,
    color: 'text-green-600',
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    description: 'Complete privacy policy including data collection, usage, and user rights',
    icon: Lock,
    color: 'text-purple-600',
  },
  {
    id: 'terms-of-service',
    title: 'Terms of Service',
    description: 'Terms of service with Plaid authorization and legal requirements',
    icon: Scale,
    color: 'text-amber-600',
  },
  {
    id: 'disclosures',
    title: 'Disclosures',
    description: 'Important disclosures about data usage, third-party services, and disclaimers',
    icon: ClipboardList,
    color: 'text-indigo-600',
  },
];

export default function DocumentExport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);

  const handleExport = async (documentType: string, title: string) => {
    setLoadingDoc(documentType);
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const { data, error } = await supabase.functions.invoke('export-document-pdf', {
        body: { documentType }
      });

      if (error) throw error;

      // Create a blob and download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentType}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export Successful',
        description: `${title} has been downloaded as PDF`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingDoc(null);
    }
  };

  const handleExportAll = async () => {
    setLoadingDoc('all');
    
    for (const doc of documents) {
      try {
        await handleExport(doc.id, doc.title);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to export ${doc.title}:`, error);
      }
    }
    
    setLoadingDoc(null);
    toast({
      title: 'Batch Export Complete',
      description: 'All documents have been downloaded',
    });
  };

  return (
    <>
      <SEOHead 
        title="Document Export - Compliance & Legal Documents"
        description="Export compliance reports, security checklists, and legal documents as PDFs"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Document Export Center</h1>
            <p className="text-muted-foreground">
              Export compliance reports, security documentation, and legal documents as PDFs
            </p>
          </div>

          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Bulk Export
              </CardTitle>
              <CardDescription>
                Download all documents at once for record-keeping and compliance purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleExportAll}
                disabled={loadingDoc !== null}
                size="lg"
                className="w-full sm:w-auto"
              >
                {loadingDoc === 'all' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting All...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export All Documents
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const Icon = doc.icon;
              const isLoading = loadingDoc === doc.id;
              
              return (
                <Card key={doc.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Icon className={`h-8 w-8 ${doc.color}`} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExport(doc.id, doc.title)}
                        disabled={loadingDoc !== null}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <CardTitle className="text-lg mt-2">{doc.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {doc.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6 border-muted">
            <CardHeader>
              <CardTitle className="text-sm">Export Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• All exports are logged for security and compliance purposes</p>
              <p>• PDFs include generation timestamp and document version</p>
              <p>• Documents are formatted for professional presentation</p>
              <p>• Admin privileges required for all exports</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
