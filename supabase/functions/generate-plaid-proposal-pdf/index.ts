import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Page 1
    let page = pdfDoc.addPage([612, 792]); // Letter size
    let yPos = 750;

    // Header
    page.drawText('Plaid Payment Initiation Integration Request', {
      x: 50,
      y: yPos,
      size: 18,
      font: helveticaBold,
      color: rgb(0.39, 0.4, 0.95),
    });

    yPos -= 25;
    page.drawText('Automated Debt Payment System - Finityo', {
      x: 50,
      y: yPos,
      size: 12,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });

    yPos -= 18;
    page.drawText(`Date: ${currentDate}`, {
      x: 50,
      y: yPos,
      size: 10,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Draw line
    yPos -= 10;
    page.drawLine({
      start: { x: 50, y: yPos },
      end: { x: 562, y: yPos },
      thickness: 2,
      color: rgb(0.39, 0.4, 0.95),
    });

    yPos -= 30;

    // Executive Summary
    page.drawText('Executive Summary', {
      x: 50,
      y: yPos,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 20;
    const summaryText = `We are developing an automated debt payment solution that helps users become debt-free by
following the proven debt snowball methodology. To deliver this feature, we require access to
Plaid's Payment Initiation API to enable scheduled ACH payments to creditors on behalf of our users.`;

    const summaryLines = summaryText.split('\n');
    for (const line of summaryLines) {
      page.drawText(line, {
        x: 50,
        y: yPos,
        size: 10,
        font: timesRoman,
        color: rgb(0, 0, 0),
      });
      yPos -= 14;
    }

    yPos -= 10;

    // Highlight box
    page.drawRectangle({
      x: 50,
      y: yPos - 35,
      width: 512,
      height: 45,
      color: rgb(0.94, 0.98, 1),
      borderColor: rgb(0.23, 0.51, 0.96),
      borderWidth: 2,
    });

    page.drawText('Business Objective:', {
      x: 60,
      y: yPos - 15,
      size: 10,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 28;
    const objectiveText = `Automate monthly debt payments following an optimized payoff strategy, eliminating manual
payment management and ensuring users stay on track to become debt-free.`;
    const objectiveLines = objectiveText.split('\n');
    for (const line of objectiveLines) {
      page.drawText(line, {
        x: 60,
        y: yPos,
        size: 9,
        font: timesRoman,
        color: rgb(0, 0, 0),
      });
      yPos -= 12;
    }

    yPos -= 25;

    // Feature Overview
    page.drawText('Feature Overview', {
      x: 50,
      y: yPos,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 18;
    page.drawText('Our automated payment system will:', {
      x: 50,
      y: yPos,
      size: 10,
      font: timesRoman,
      color: rgb(0, 0, 0),
    });

    yPos -= 18;

    const features = [
      'Follow Debt Snowball Methodology: Prioritize debts by balance while maintaining minimum',
      '  payments on all accounts',
      'Schedule Strategic Payments: Automatically pay each debt on its due date with the calculated',
      '  optimal amount',
      'Roll Forward Freed Payments: When a debt is paid off, automatically redirect that payment',
      '  amount to the next priority debt',
      'Provide Forecasting: Show users their exact debt-free date based on their payment plan',
      'Track Progress: Monitor payment success/failure and update balances in real-time',
    ];

    for (const feature of features) {
      if (feature.startsWith('  ')) {
        page.drawText(feature, {
          x: 70,
          y: yPos,
          size: 9,
          font: timesRoman,
          color: rgb(0, 0, 0),
        });
      } else {
        page.drawText(`• ${feature}`, {
          x: 60,
          y: yPos,
          size: 9,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
      }
      yPos -= 13;
    }

    yPos -= 10;

    // Technical Requirements
    page.drawText('Technical Requirements from Plaid', {
      x: 50,
      y: yPos,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 22;

    page.drawText('1. Payment Initiation API Access', {
      x: 50,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 16;

    const apiAccessItems = [
      'Production environment credentials for Payment Initiation',
      'Sandbox access for development and testing',
      'API documentation specific to ACH payment initiation',
      'Rate limits and usage guidelines',
    ];

    for (const item of apiAccessItems) {
      page.drawText(`• ${item}`, {
        x: 60,
        y: yPos,
        size: 9,
        font: timesRoman,
        color: rgb(0, 0, 0),
      });
      yPos -= 13;
    }

    // Page 2
    page = pdfDoc.addPage([612, 792]);
    yPos = 750;

    page.drawText('2. Required API Capabilities', {
      x: 50,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 20;

    const capabilities = [
      ['ACH Payment Initiation', 'Transfer funds from user\'s bank to creditors', 'Critical'],
      ['Scheduled Payments', 'Set up recurring payments on specific due dates', 'Critical'],
      ['Payment Status Webhooks', 'Receive real-time updates on payment processing', 'Critical'],
      ['Balance Verification', 'Confirm sufficient funds before initiating payment', 'High'],
      ['Payment Modification', 'Allow users to pause or adjust scheduled payments', 'High'],
      ['Multi-creditor Support', 'Enable payments to multiple creditors simultaneously', 'Critical'],
    ];

    // Table header
    page.drawRectangle({
      x: 50,
      y: yPos - 15,
      width: 512,
      height: 20,
      color: rgb(0.97, 0.97, 0.97),
    });

    page.drawText('Capability', { x: 55, y: yPos - 10, size: 9, font: helveticaBold });
    page.drawText('Purpose', { x: 220, y: yPos - 10, size: 9, font: helveticaBold });
    page.drawText('Priority', { x: 480, y: yPos - 10, size: 9, font: helveticaBold });

    yPos -= 20;

    for (const [capability, purpose, priority] of capabilities) {
      page.drawLine({
        start: { x: 50, y: yPos },
        end: { x: 562, y: yPos },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      yPos -= 12;

      page.drawText(capability, { x: 55, y: yPos, size: 8, font: timesRoman });
      page.drawText(purpose.substring(0, 35), { x: 220, y: yPos, size: 8, font: timesRoman });
      if (purpose.length > 35) {
        yPos -= 10;
        page.drawText(purpose.substring(35), { x: 220, y: yPos, size: 8, font: timesRoman });
        yPos -= 5;
      }
      page.drawText(priority, { x: 480, y: yPos, size: 8, font: helveticaBold });

      yPos -= 8;
    }

    yPos -= 20;

    // Authentication & Security
    page.drawText('3. Authentication & Security', {
      x: 50,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 16;

    const authItems = [
      'Production API keys (Client ID, Secret)',
      'OAuth credentials for secure user authorization',
      'Webhook signature verification keys',
      'Documentation on security best practices for payment handling',
    ];

    for (const item of authItems) {
      page.drawText(`• ${item}`, {
        x: 60,
        y: yPos,
        size: 9,
        font: timesRoman,
        color: rgb(0, 0, 0),
      });
      yPos -= 13;
    }

    yPos -= 10;

    // Critical Requirements Box
    page.drawRectangle({
      x: 50,
      y: yPos - 70,
      width: 512,
      height: 80,
      color: rgb(1, 0.95, 0.78),
      borderColor: rgb(0.96, 0.62, 0.04),
      borderWidth: 2,
    });

    page.drawText('⚠ Critical Requirements', {
      x: 60,
      y: yPos - 15,
      size: 11,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 30;

    const criticalReqs = [
      'Ability to schedule payments up to 12+ months in advance',
      'Support for variable payment amounts per schedule',
      'Real-time payment status updates via webhooks',
      'Compliance with ACH regulations and user consent requirements',
    ];

    for (const req of criticalReqs) {
      page.drawText(`• ${req}`, {
        x: 60,
        y: yPos,
        size: 9,
        font: timesRoman,
        color: rgb(0, 0, 0),
      });
      yPos -= 13;
    }

    yPos -= 25;

    // Implementation Architecture
    page.drawText('Implementation Architecture', {
      x: 50,
      y: yPos,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 20;

    page.drawText('Payment Flow:', {
      x: 50,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 16;

    const paymentFlow = [
      '1. User Authorization: User connects bank account via Plaid Link',
      '2. Debt Analysis: System calculates optimal payment schedule',
      '3. Payment Scheduling: Edge functions create scheduled payments',
      '4. Pre-Payment Verification: Check account balance before each payment',
      '5. Payment Execution: Initiate ACH transfer via Plaid Payment API',
      '6. Status Monitoring: Webhook receives payment status updates',
      '7. Balance Updates: Update debt balances and recalculate schedule',
      '8. User Notifications: Notify users of payment success/failure',
    ];

    for (const step of paymentFlow) {
      page.drawText(step, {
        x: 60,
        y: yPos,
        size: 9,
        font: timesRoman,
        color: rgb(0, 0, 0),
      });
      yPos -= 13;
    }

    // Page 3
    page = pdfDoc.addPage([612, 792]);
    yPos = 750;

    // Expected Timeline
    page.drawText('Expected Timeline', {
      x: 50,
      y: yPos,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 20;

    const timeline = [
      ['Phase', 'Duration', 'Deliverables'],
      ['API Access & Setup', '1 week', 'Credentials, documentation review'],
      ['Core Development', '2-3 weeks', 'Payment scheduling, edge functions'],
      ['Testing & Refinement', '1-2 weeks', 'Sandbox testing, error handling'],
      ['Production Launch', '1 week', 'Certification, limited rollout'],
    ];

    // Table header
    page.drawRectangle({
      x: 50,
      y: yPos - 15,
      width: 512,
      height: 20,
      color: rgb(0.97, 0.97, 0.97),
    });

    page.drawText(timeline[0][0], { x: 55, y: yPos - 10, size: 9, font: helveticaBold });
    page.drawText(timeline[0][1], { x: 200, y: yPos - 10, size: 9, font: helveticaBold });
    page.drawText(timeline[0][2], { x: 320, y: yPos - 10, size: 9, font: helveticaBold });

    yPos -= 20;

    for (let i = 1; i < timeline.length; i++) {
      page.drawLine({
        start: { x: 50, y: yPos },
        end: { x: 562, y: yPos },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      yPos -= 12;

      page.drawText(timeline[i][0], { x: 55, y: yPos, size: 8, font: timesRoman });
      page.drawText(timeline[i][1], { x: 200, y: yPos, size: 8, font: timesRoman });
      page.drawText(timeline[i][2], { x: 320, y: yPos, size: 8, font: timesRoman });

      yPos -= 10;
    }

    yPos -= 20;

    // Success Metrics
    page.drawText('Success Metrics', {
      x: 50,
      y: yPos,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 18;

    const metrics = [
      'Payment Success Rate: > 95% of scheduled payments processed successfully',
      'User Adoption: 60%+ of active users enable automated payments',
      'Time to Debt-Free: Users reduce payoff timeline by 20%+ vs manual payments',
      'User Satisfaction: NPS score of 8+ for automated payment feature',
    ];

    for (const metric of metrics) {
      page.drawText(`• ${metric}`, {
        x: 60,
        y: yPos,
        size: 9,
        font: timesRoman,
        color: rgb(0, 0, 0),
      });
      yPos -= 13;
    }

    yPos -= 15;

    // Key Benefit Box
    page.drawRectangle({
      x: 50,
      y: yPos - 55,
      width: 512,
      height: 65,
      color: rgb(0.94, 0.98, 1),
      borderColor: rgb(0.23, 0.51, 0.96),
      borderWidth: 2,
    });

    page.drawText('🎯 Key Benefit to Users', {
      x: 60,
      y: yPos - 15,
      size: 11,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 30;

    const benefitText = `Users will achieve financial freedom faster by eliminating manual payment management,
ensuring optimal debt payoff strategy execution, and never missing a payment or forgetting
to roll forward freed-up funds to the next priority debt.`;

    const benefitLines = benefitText.split('\n');
    for (const line of benefitLines) {
      page.drawText(line, {
        x: 60,
        y: yPos,
        size: 9,
        font: timesRoman,
        color: rgb(0, 0, 0),
      });
      yPos -= 12;
    }

    yPos -= 25;

    // Questions for Plaid Team
    page.drawText('Questions for Plaid Team', {
      x: 50,
      y: yPos,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 18;

    const questions = [
      'What is the typical approval timeline for Payment Initiation API access?',
      'Are there specific compliance or certification requirements we need to complete?',
      'What are the transaction fees for ACH payments via your Payment Initiation API?',
      'Do you support variable recurring payments (amount changes each month)?',
      'What is the maximum number of scheduled payments we can set up per user?',
      'How far in advance can payments be scheduled?',
      'What is your recommended approach for handling payment failures and retries?',
      'Are there any institutions that don\'t support payment initiation?',
    ];

    for (let i = 0; i < questions.length; i++) {
      page.drawText(`${i + 1}. ${questions[i]}`, {
        x: 60,
        y: yPos,
        size: 9,
        font: timesRoman,
        color: rgb(0, 0, 0),
      });
      yPos -= 13;
    }

    yPos -= 20;

    // Footer
    page.drawLine({
      start: { x: 50, y: yPos },
      end: { x: 562, y: yPos },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    });

    yPos -= 20;

    page.drawText('Contact Information', {
      x: 50,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 16;

    const contactInfo = [
      'Project: Finityo - Automated Debt Freedom Platform',
      'Current Plaid Integration: Active (Liabilities & Accounts data access)',
      'Status: Ready to begin implementation upon API access approval',
    ];

    for (const info of contactInfo) {
      page.drawText(info, {
        x: 50,
        y: yPos,
        size: 9,
        font: timesRoman,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPos -= 13;
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes as unknown as BodyInit, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Plaid_Payment_Integration_Request.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});