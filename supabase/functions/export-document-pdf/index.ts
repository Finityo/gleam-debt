import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple HTML document generation
const generateHTML = (html: string, title: string): string => {
  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    h3 { color: #1e3a8a; }
    pre { background: #f3f4f6; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f3f4f6; font-weight: 600; }
    .header { text-align: center; margin-bottom: 40px; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
    .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 600; }
    .status-complete { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  ${html}
  <div class="footer">
    <p><strong>Finityo Debt Payoff Manager</strong></p>
    <p>This document was automatically generated for compliance and record-keeping purposes.</p>
  </div>
</body>
</html>`;

  return fullHtml;
};

const markdownToHtml = (markdown: string): string => {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Code blocks
  html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
  
  // Inline code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Checkboxes
  html = html.replace(/\[x\]/gi, '<span class="status-badge status-complete">✓ Complete</span>');
  html = html.replace(/\[ \]/g, '<span class="status-badge status-pending">○ Pending</span>');
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  
  // Tables (basic support)
  html = html.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split('|').filter(c => c.trim());
    const cellTags = cells.map(c => `<td>${c.trim()}</td>`).join('');
    return `<tr>${cellTags}</tr>`;
  });
  
  return html;
};

// Document content stored securely server-side
const getPlaidComplianceContent = () => `# Plaid MSA Compliance Implementation Report

**Report Date:** January 17, 2025  
**Platform:** Finityo Debt Payoff Application  
**Status:** ✅ **COMPLIANT** - All Critical Requirements Implemented

---

## Executive Summary

This document provides a comprehensive mapping of Plaid Master Services Agreement (MSA) requirements to the implemented features in the Finityo platform. All high-priority and medium-priority compliance items have been successfully implemented.

### Compliance Status Overview
- **Critical Requirements:** ✅ 8/8 Complete (100%)
- **Important Requirements:** ✅ 5/5 Complete (100%)
- **Documentation:** ✅ Complete
- **Technical Implementation:** ✅ Verified

[Full compliance report content available in repository]
`;

const getSecurityNotesContent = () => `# Security Review & Fixes - Updated 2025-10-22

## 🔒 Comprehensive Security Review - October 22, 2025

**Security Score: 9.5/10** (Excellent)

All critical vulnerabilities have been resolved. The application now implements enterprise-grade security with:
- ✅ End-to-end encryption for sensitive data (Plaid tokens in Vault)
- ✅ Complete authentication and authorization controls
- ✅ Row-level security on all tables
- ✅ Server-side validation and rate limiting
- ✅ Comprehensive audit logging
- ✅ Secure admin operations via edge functions
- ✅ Database function security hardening

### Recent Fixes (October 22, 2025)

#### ✅ CRITICAL: Client-Side Admin Operations Eliminated
**Status:** FIXED  
**Severity:** CRITICAL ERROR  
**Implementation:**
- ✅ Created delete-user-account edge function using service role
- ✅ Updated Profile.tsx to call secure backend endpoint
- ✅ Removed client-side supabase.auth.admin.deleteUser() call
- ✅ Account deletion now properly authenticates and uses admin privileges server-side

[Full security checklist available in repository]
`;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'No authorization header provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({ error: 'Authentication failed: ' + (authError?.message || 'Invalid token') }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roles || roles.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { documentType } = await req.json();

    let content = '';
    let title = '';

    // Server-side document content (secure - not exposed to client)
    switch (documentType) {
      case 'plaid-compliance':
        title = 'Plaid MSA Compliance Report';
        content = getPlaidComplianceContent();
        break;
      
      case 'security-notes':
        title = 'Security Review & Testing Checklist';
        content = getSecurityNotesContent();
        break;
      
      case 'privacy-policy':
        title = 'Privacy Policy';
        content = '# Privacy Policy\n\n[Content to be rendered from Privacy page]';
        break;
      
      case 'terms-of-service':
        title = 'Terms of Service';
        content = '# Terms of Service\n\n[Content to be rendered from Terms page]';
        break;
      
      case 'disclosures':
        title = 'Disclosures';
        content = '# Disclosures\n\n[Content to be rendered from Disclosures page]';
        break;
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid document type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Convert markdown to HTML
    const html = markdownToHtml(content);
    
    // Generate HTML document
    const htmlDocument = generateHTML(html, title);

    // Log the export
    console.log(`Document exported: ${documentType} by user ${user.id}`);

    // Return HTML document
    return new Response(htmlDocument, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${documentType}-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
