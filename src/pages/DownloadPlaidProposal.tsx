import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const DownloadPlaidProposal = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      const { data, error } = await supabase.functions.invoke('generate-plaid-proposal-pdf', {
        method: 'POST',
      });

      if (error) throw error;

      // Create blob from response
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Plaid_Payment_Integration_Request.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success!',
        description: 'PDF downloaded successfully',
      });
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to download PDF',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Plaid Payment Integration Proposal</CardTitle>
          <CardDescription>
            Download the comprehensive proposal document for Plaid Payment Initiation API integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold">Document Includes:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ Executive Summary</li>
              <li>✓ Feature Overview & Business Objectives</li>
              <li>✓ Technical Requirements from Plaid</li>
              <li>✓ Required API Capabilities</li>
              <li>✓ Implementation Architecture</li>
              <li>✓ Expected Timeline & Success Metrics</li>
              <li>✓ Questions for Plaid Team</li>
            </ul>
          </div>

          <Button 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="w-full"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            {isDownloading ? 'Generating PDF...' : 'Download PDF Proposal'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            This document is ready to send to your Plaid account manager
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DownloadPlaidProposal;