import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DebtData {
  name?: string;
  last4?: string;
  balance?: number;
  minPayment?: number;
  apr?: number;
  dueDate?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    // Convert file to base64 for parsing
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Parse PDF using a third-party service (you could use pdf.js or similar)
    // For now, we'll use a simple extraction approach
    const pdfText = await extractTextFromPDF(arrayBuffer);
    
    // Extract debt information from the text
    const debtData = extractDebtInfo(pdfText);

    return new Response(
      JSON.stringify({ success: true, debtData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  // Simple PDF text extraction
  // In a production environment, you'd use a proper PDF parsing library
  const uint8Array = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder('utf-8');
  let text = decoder.decode(uint8Array);
  
  // Remove PDF structure characters
  text = text.replace(/[^\x20-\x7E\n]/g, ' ');
  
  return text;
}

function extractDebtInfo(text: string): DebtData[] {
  const debts: DebtData[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  // Common patterns in credit card statements
  const patterns = {
    balance: /(?:balance|amount owed|current balance|outstanding)[\s:$]*([0-9,]+\.?\d{0,2})/i,
    minPayment: /(?:minimum payment|min\. payment|payment due|minimum due)[\s:$]*([0-9,]+\.?\d{0,2})/i,
    apr: /(?:apr|annual percentage rate|interest rate)[\s:]*([0-9.]+)%?/i,
    last4: /(?:account ending in|card ending|account number|card number)[\s:]*[*xX]*(\d{4})/i,
    dueDate: /(?:due date|payment due|due by)[\s:]*(?:\w+\s+)?(\d{1,2})/i,
    accountName: /(?:account|card name|product)[\s:]*([A-Za-z\s]+(?:card|credit|visa|mastercard|discover|amex))/i
  };

  let currentDebt: DebtData = {};
  
  for (const line of lines) {
    // Try to match balance
    const balanceMatch = line.match(patterns.balance);
    if (balanceMatch) {
      currentDebt.balance = parseFloat(balanceMatch[1].replace(/,/g, ''));
    }
    
    // Try to match minimum payment
    const minPaymentMatch = line.match(patterns.minPayment);
    if (minPaymentMatch) {
      currentDebt.minPayment = parseFloat(minPaymentMatch[1].replace(/,/g, ''));
    }
    
    // Try to match APR
    const aprMatch = line.match(patterns.apr);
    if (aprMatch) {
      currentDebt.apr = parseFloat(aprMatch[1]);
    }
    
    // Try to match last 4 digits
    const last4Match = line.match(patterns.last4);
    if (last4Match) {
      currentDebt.last4 = last4Match[1];
    }
    
    // Try to match due date
    const dueDateMatch = line.match(patterns.dueDate);
    if (dueDateMatch) {
      currentDebt.dueDate = dueDateMatch[1];
    }
    
    // Try to match account name
    const nameMatch = line.match(patterns.accountName);
    if (nameMatch) {
      currentDebt.name = nameMatch[1].trim();
    }
  }
  
  // If we found enough information, add to debts array
  if (currentDebt.balance || currentDebt.minPayment) {
    // Set default name if none found
    if (!currentDebt.name) {
      currentDebt.name = currentDebt.last4 ? `Card ending in ${currentDebt.last4}` : 'Credit Card';
    }
    
    debts.push(currentDebt);
  }
  
  return debts;
}
